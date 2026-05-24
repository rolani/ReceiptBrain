"""call_recommend OpenAI integration (mocked)."""

from __future__ import annotations

import inspect
import sys
import types
from typing import Any

import pytest

from app import openai_client


def _aggregate() -> dict[str, Any]:
    return {
        "windowDays": 90,
        "currency": "CAD",
        "location": {"label": "Canada", "country": "CA"},
        "summary": {
            "topMerchants": [],
            "monthlyTotals": [],
            "recurringCandidates": [],
        },
    }


def test_recommend_json_schema_shape() -> None:
    schema = openai_client._recommend_json_schema()
    assert schema["name"] == "Recommendations"
    assert schema["schema"]["required"] == ["items"]


def test_call_recommend_uses_json_schema_not_json_object() -> None:
    src = inspect.getsource(openai_client.call_recommend)
    assert '"type": "json_object"' not in src
    assert '"type": "json_schema"' in src


@pytest.mark.asyncio
async def test_call_recommend_parses_openai_response_not_tuple(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Trailing comma after create() made response a 1-tuple — regression guard."""
    captured: dict[str, Any] = {}

    class FakeUsage:
        prompt_tokens = 10
        completion_tokens = 5

    class FakeMessage:
        content = (
            '{"items": [{"type": "optimization_tip", "title": "Tip", '
            '"description": "Save more.", "estimatedSavings": 10, '
            '"currency": "CAD", "sourceReceiptIds": [], "confidence": 0.8}]}'
        )

    class FakeChoice:
        message = FakeMessage()

    class FakeResponse:
        choices = [FakeChoice()]
        usage = FakeUsage()

    def fake_create(**kwargs: Any) -> FakeResponse:
        captured.update(kwargs)
        return FakeResponse()

    class FakeCompletions:
        @staticmethod
        def create(**kwargs: Any) -> FakeResponse:
            return fake_create(**kwargs)

    class FakeChat:
        completions = FakeCompletions()

    class FakeClient:
        chat = FakeChat()

    fake_openai = types.ModuleType("openai")
    fake_openai.OpenAI = lambda api_key: FakeClient()  # noqa: ARG005
    monkeypatch.delitem(sys.modules, "openai", raising=False)
    monkeypatch.setitem(sys.modules, "openai", fake_openai)

    items, usage = await openai_client.call_recommend(
        _aggregate(), prompt_version="recommend-v1"
    )

    assert len(items) == 1
    assert items[0]["title"] == "Tip"
    assert usage["promptTokens"] == 10
    assert captured["response_format"]["type"] == "json_schema"
