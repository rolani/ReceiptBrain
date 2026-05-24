"""Settings validation tests."""

from __future__ import annotations

import os

import pytest
from pydantic import ValidationError


def test_settings_load_with_env(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.settings import Settings, get_settings

    get_settings.cache_clear()  # type: ignore[attr-defined]
    monkeypatch.setenv("AI_SERVICE_TOKEN", "tok")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-x")
    s = Settings()  # type: ignore[call-arg]
    assert s.ai_service_token == "tok"
    assert s.openai_model_extract == "gpt-4o"  # default


def test_settings_missing_required_raise(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.settings import Settings, get_settings

    get_settings.cache_clear()  # type: ignore[attr-defined]
    for key in ("AI_SERVICE_TOKEN", "OPENAI_API_KEY"):
        monkeypatch.delenv(key, raising=False)
    # Ensure other os.environ doesn't override
    os.environ.pop("AI_SERVICE_TOKEN", None)
    os.environ.pop("OPENAI_API_KEY", None)
    with pytest.raises(ValidationError):
        Settings()  # type: ignore[call-arg]
