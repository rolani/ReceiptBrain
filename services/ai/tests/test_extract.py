"""/extract endpoint tests with mocked OpenAI."""

from __future__ import annotations

import base64
import json
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

INTERNAL_TOKEN_HEADER = {"X-Internal-Token": "test-token"}
FIXTURE_DIR = Path(__file__).parent.parent.parent.parent / "fixtures" / "receipts"


def _b64_synthetic_jpeg() -> str:
    # Smallest valid JPEG header (not a real image but lets the request parse).
    # OpenAI is mocked so the image bytes are never inspected.
    return base64.b64encode(bytes.fromhex("ffd8ffe000104a464946000101")).decode()


def _mock_openai_response(
    merchant: str = "Starbucks", total: float = 13.50
) -> dict[str, Any]:
    return {
        "merchant": merchant,
        "rawMerchant": f"{merchant.upper()} #1234",
        "currency": "USD",
        "subtotal": round(total - 1.10, 2),
        "tax": 1.10,
        "tip": 0.00,
        "total": total,
        "purchasedAt": "2026-05-22T15:04:00Z",
        "paymentLast4": "4242",
        "items": [
            {
                "name": "Latte",
                "unitPrice": 5.20,
                "quantity": 1,
                "lineTotal": 5.20,
                "category": "dining",
                "confidence": 0.96,
            }
        ],
        "fieldConfidence": {
            "merchant": 0.98,
            "total": 0.99,
            "purchasedAt": 0.92,
            "items": 0.93,
        },
    }


def test_extract_happy_path_returns_structured_payload(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app import openai_client

    async def fake_extract(
        _image: bytes, *, prompt_version: str
    ) -> tuple[dict[str, Any], dict[str, int | float]]:
        return _mock_openai_response(), {
            "promptTokens": 1500,
            "completionTokens": 220,
            "costUsdEstimate": 0.0075,
        }

    monkeypatch.setattr(openai_client, "call_extract", fake_extract)

    res = client.post(
        "/extract",
        json={"image_b64": _b64_synthetic_jpeg()},
        headers=INTERNAL_TOKEN_HEADER,
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["merchant"] == "Starbucks"
    assert body["total"] == 13.50
    assert body["usage"]["promptTokens"] == 1500
    assert body["model"]  # populated from settings
    assert body["promptVersion"] == "extract-v1"


def test_extract_returns_500_on_openai_failure(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app import openai_client

    async def boom(
        _image: bytes, *, prompt_version: str
    ) -> tuple[dict[str, Any], dict[str, int | float]]:
        raise RuntimeError("openai exploded")

    monkeypatch.setattr(openai_client, "call_extract", boom)
    res = client.post(
        "/extract",
        json={"image_b64": _b64_synthetic_jpeg()},
        headers=INTERNAL_TOKEN_HEADER,
    )
    assert res.status_code == 502
    assert res.json()["error"] == "upstream_error"


@pytest.fixture()
def synthetic_fixture(tmp_path: Path) -> Path:
    """Materialize a tiny fixture with ground-truth JSON for the parity test."""
    img_path = FIXTURE_DIR / "synthetic-01.jpg"
    gt_path = FIXTURE_DIR / "synthetic-01.json"
    assert img_path.exists(), f"missing fixture: {img_path}"
    assert gt_path.exists(), f"missing fixture: {gt_path}"
    return img_path


def test_extract_matches_ground_truth_within_tolerance(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    synthetic_fixture: Path,
) -> None:
    """Simulate OpenAI returning the ground-truth, then assert the API surface
    preserves merchant exactly and total within ±$0.01 (rule: ai-fixtures)."""
    from app import openai_client

    gt = json.loads((FIXTURE_DIR / "synthetic-01.json").read_text())

    async def from_truth(_img: bytes, *, prompt_version: str):
        return (
            {
                "merchant": gt["merchant"],
                "rawMerchant": gt["rawMerchant"],
                "currency": gt["currency"],
                "subtotal": gt["subtotal"],
                "tax": gt["tax"],
                "tip": gt.get("tip", 0.0),
                "total": gt["total"],
                "purchasedAt": gt["purchasedAt"],
                "paymentLast4": gt.get("paymentLast4"),
                "items": gt["items"],
                "fieldConfidence": {
                    "merchant": 0.99,
                    "total": 0.99,
                    "purchasedAt": 0.95,
                    "items": 0.95,
                },
            },
            {"promptTokens": 1000, "completionTokens": 200, "costUsdEstimate": 0.005},
        )

    monkeypatch.setattr(openai_client, "call_extract", from_truth)

    img_b64 = base64.b64encode(synthetic_fixture.read_bytes()).decode()
    res = client.post("/extract", json={"image_b64": img_b64}, headers=INTERNAL_TOKEN_HEADER)
    assert res.status_code == 200
    body = res.json()
    assert body["merchant"] == gt["merchant"]
    assert abs(body["total"] - gt["total"]) < 0.01
    assert len(body["items"]) == len(gt["items"])
