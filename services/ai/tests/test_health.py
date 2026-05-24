"""Health endpoint contract tests."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient) -> None:
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is True
    assert body["service"] == "ai"


def test_health_exposes_model_and_prompt_versions(client: TestClient) -> None:
    body = client.get("/health").json()
    assert body["model_extract"] == "gpt-4o"
    assert body["model_recommend"] == "gpt-4o-mini"
    assert set(body["prompt_versions"].keys()) == {"extract", "recommend"}
