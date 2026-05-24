"""Internal-token middleware tests — /extract and /recommend are worker-only."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_extract_without_token_returns_401(client: TestClient) -> None:
    res = client.post("/extract", json={"image_b64": "abc"})
    assert res.status_code == 401
    assert res.json()["error"] == "unauthorized"


def test_extract_with_wrong_token_returns_401(client: TestClient) -> None:
    res = client.post(
        "/extract",
        json={"image_b64": "abc"},
        headers={"X-Internal-Token": "wrong"},
    )
    assert res.status_code == 401


def test_health_is_public(client: TestClient) -> None:
    res = client.get("/health")
    assert res.status_code == 200
