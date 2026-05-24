"""/recommend endpoint tests with mocked OpenAI."""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

INTERNAL_TOKEN_HEADER = {"X-Internal-Token": "test-token"}


def _aggregate_input() -> dict[str, Any]:
    return {
        "windowDays": 90,
        "currency": "USD",
        "summary": {
            "topMerchants": [{"merchant": "Starbucks", "spend": 124.30, "visits": 21}],
            "monthlyTotals": [{"month": "2026-04", "total": 1230.10}],
            "recurringCandidates": [
                {
                    "merchant": "Netflix",
                    "amount": 15.99,
                    "interval": "monthly",
                    "lastCharge": "2026-05-01T00:00:00Z",
                    "occurrences": 6,
                }
            ],
        },
    }


def test_recommend_happy_path(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from app import openai_client

    async def fake_recommend(_input: dict[str, Any], *, prompt_version: str):
        return (
            [
                {
                    "type": "subscription_waste",
                    "title": "Cancel unused Netflix",
                    "description": "6 monthly charges, no activity in 60 days.",
                    "estimatedSavings": 191.88,
                    "currency": "USD",
                    "action": {
                        "label": "Cancel subscription",
                        "kind": "external_link",
                        "target": "https://netflix.com/cancel",
                    },
                    "sourceReceiptIds": [],
                    "confidence": 0.86,
                }
            ],
            {"promptTokens": 800, "completionTokens": 180, "costUsdEstimate": 0.0042},
        )

    monkeypatch.setattr(openai_client, "call_recommend", fake_recommend)
    res = client.post("/recommend", json=_aggregate_input(), headers=INTERNAL_TOKEN_HEADER)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["items"][0]["type"] == "subscription_waste"
    assert body["usage"]["promptTokens"] == 800
    assert body["promptVersion"] == "recommend-v1"


def test_recommend_rejects_unauthenticated(client: TestClient) -> None:
    res = client.post("/recommend", json=_aggregate_input())
    assert res.status_code == 401


def test_recommend_validates_input_shape(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    res = client.post("/recommend", json={"bad": "input"}, headers=INTERNAL_TOKEN_HEADER)
    assert res.status_code == 422
