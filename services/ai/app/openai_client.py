"""OpenAI client wrapper using Structured Outputs.

Production calls go through here; tests monkeypatch `call_extract` and
`call_recommend` so no live OpenAI requests fire in CI.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from .pii import strip_pan_candidates
from .settings import get_settings


def _normalize_purchased_at(value: Any) -> str:
    """Coerce model output to RFC 3339 / ISO 8601, or empty string.

    The structured-output schema asks for a string, but GPT-4o occasionally
    emits date-only ("2026-05-22"), US-style ("05/22/2026 3:04 PM"), or
    "Unknown". The worker treats empty/invalid as "needs_review", so it's
    safer to normalize here than to ship malformed dates downstream.
    """
    if not isinstance(value, str) or not value.strip():
        return ""
    s = value.strip()
    # Try a handful of common formats; first match wins.
    candidates = [
        s,
        s.replace("Z", "+00:00"),
        s + "T00:00:00+00:00",
    ]
    for c in candidates:
        try:
            dt = datetime.fromisoformat(c)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=UTC)
            return dt.astimezone(UTC).isoformat().replace("+00:00", "Z")
        except ValueError:
            pass
    for fmt in ("%m/%d/%Y", "%m/%d/%Y %H:%M", "%m/%d/%Y %I:%M %p", "%Y-%m-%d %H:%M:%S"):
        try:
            dt = datetime.strptime(s, fmt).replace(tzinfo=UTC)
            return dt.isoformat().replace("+00:00", "Z")
        except ValueError:
            continue
    return ""


def _extract_json_schema() -> dict[str, Any]:
    return {
        "name": "ReceiptExtraction",
        "schema": {
            "type": "object",
            "properties": {
                "merchant": {"type": "string"},
                "rawMerchant": {"type": ["string", "null"]},
                "currency": {"type": "string"},
                "subtotal": {"type": ["number", "null"]},
                "tax": {"type": ["number", "null"]},
                "tip": {"type": ["number", "null"]},
                "total": {"type": "number"},
                "purchasedAt": {
                    "type": "string",
                    "description": (
                        "ISO 8601 timestamp of the purchase, e.g. "
                        "'2026-05-22T15:04:00Z'. If unknown, return an "
                        "empty string."
                    ),
                },
                "paymentLast4": {"type": ["string", "null"]},
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "unitPrice": {"type": "number"},
                            "quantity": {"type": "integer"},
                            "lineTotal": {"type": "number"},
                            "category": {"type": ["string", "null"]},
                            "confidence": {"type": ["number", "null"]},
                        },
                        "required": ["name", "unitPrice", "quantity", "lineTotal"],
                    },
                },
                "fieldConfidence": {
                    "type": "object",
                    "properties": {
                        "merchant": {"type": ["number", "null"]},
                        "total": {"type": ["number", "null"]},
                        "purchasedAt": {"type": ["number", "null"]},
                        "items": {"type": ["number", "null"]},
                    },
                },
            },
            "required": [
                "merchant",
                "currency",
                "total",
                "purchasedAt",
                "items",
                "fieldConfidence",
            ],
        },
    }


async def call_extract(
    image: bytes, *, prompt_version: str
) -> tuple[dict[str, Any], dict[str, int | float]]:
    """Real OpenAI call. Returns (structured payload, usage)."""
    import base64
    import json as _json
    import time

    from openai import OpenAI

    settings = get_settings()
    client = OpenAI(api_key=settings.openai_api_key)
    image_b64 = base64.b64encode(image).decode()

    started = time.perf_counter()
    response = client.chat.completions.create(  # type: ignore[call-arg]
        model=settings.openai_model_extract,
        response_format={
            "type": "json_schema",
            "json_schema": _extract_json_schema(),
        },
        messages=[
            {
                "role": "system",
                "content": (
                    "Extract structured receipt data. Be conservative — set "
                    "fieldConfidence below 0.7 if you are unsure. Strip any "
                    "card numbers from output."
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"Prompt version: {prompt_version}"},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                    },
                ],
            },
        ],
    )
    duration_ms = int((time.perf_counter() - started) * 1000)
    raw_text = response.choices[0].message.content or "{}"
    safe = strip_pan_candidates(raw_text)
    payload = _json.loads(safe)
    payload["purchasedAt"] = _normalize_purchased_at(payload.get("purchasedAt"))
    prompt_tokens = int(response.usage.prompt_tokens) if response.usage else 0
    completion_tokens = int(response.usage.completion_tokens) if response.usage else 0
    usage = {
        "promptTokens": prompt_tokens,
        "completionTokens": completion_tokens,
        # Rough estimate; production should use real $/1k pricing per model.
        "costUsdEstimate": round(
            (prompt_tokens * 2.5 + completion_tokens * 10) / 1_000_000, 6
        ),
    }
    payload["_durationMs"] = duration_ms
    return payload, usage


def _recommend_json_schema() -> dict[str, Any]:
    return {
        "name": "Recommendations",
        "schema": {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "maxItems": 5,
                    "items": {
                        "type": "object",
                        "properties": {
                            "type": {
                                "type": "string",
                                "enum": [
                                    "cheaper_alternative",
                                    "subscription_waste",
                                    "spending_spike",
                                    "optimization_tip",
                                ],
                            },
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "estimatedSavings": {"type": ["number", "null"]},
                            "currency": {"type": ["string", "null"]},
                            "action": {
                                "type": ["object", "null"],
                                "properties": {
                                    "label": {"type": "string"},
                                    "kind": {
                                        "type": "string",
                                        "enum": [
                                            "external_link",
                                            "in_app",
                                            "dismiss",
                                        ],
                                    },
                                    "target": {"type": ["string", "null"]},
                                },
                                "required": ["label", "kind"],
                            },
                            "sourceReceiptIds": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                            "sourceSubscriptionId": {"type": ["string", "null"]},
                            "confidence": {"type": "number"},
                        },
                        "required": [
                            "type",
                            "title",
                            "description",
                            "sourceReceiptIds",
                            "confidence",
                        ],
                    },
                }
            },
            "required": ["items"],
        },
    }


async def call_recommend(
    aggregate: dict[str, Any], *, prompt_version: str
) -> tuple[list[dict[str, Any]], dict[str, int | float]]:
    """Real OpenAI call for recommendations."""
    import json as _json
    import time

    from openai import OpenAI

    settings = get_settings()
    client = OpenAI(api_key=settings.openai_api_key)
    started = time.perf_counter()
    response = client.chat.completions.create(  # type: ignore[call-arg]
        model=settings.openai_model_recommend,
        response_format={
            "type": "json_schema",
            "json_schema": _recommend_json_schema(),
        },
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a careful personal finance assistant. Given an "
                    "aggregate of the user's last 90 days of spending, return "
                    "at most 5 actionable, explainable recommendations. Cite "
                    "source receipts and subscriptions where possible. "
                    "Use the request currency for all savings amounts. "
                    "Use the location label and merchantHints for local, "
                    "region-appropriate alternatives (e.g. Canadian retailers "
                    "and services when location is in Canada)."
                ),
            },
            {
                "role": "user",
                "content": f"Prompt version: {prompt_version}\n{_json.dumps(aggregate)}",
            },
        ],
    )
    _ = int((time.perf_counter() - started) * 1000)
    raw = response.choices[0].message.content or '{"items": []}'
    parsed = _json.loads(raw)
    items = parsed.get("items", [])
    prompt_tokens = int(response.usage.prompt_tokens) if response.usage else 0
    completion_tokens = int(response.usage.completion_tokens) if response.usage else 0
    usage = {
        "promptTokens": prompt_tokens,
        "completionTokens": completion_tokens,
        "costUsdEstimate": round(
            (prompt_tokens * 0.15 + completion_tokens * 0.6) / 1_000_000, 6
        ),
    }
    return items, usage
