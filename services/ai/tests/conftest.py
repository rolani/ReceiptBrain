"""Test fixtures and shared env defaults."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

# Set test env BEFORE importing app modules.
os.environ.setdefault("AI_SERVICE_TOKEN", "test-token")
os.environ.setdefault("OPENAI_API_KEY", "sk-test")
os.environ.setdefault("OPENAI_MODEL_EXTRACT", "gpt-4o")
os.environ.setdefault("OPENAI_MODEL_RECOMMEND", "gpt-4o-mini")


@pytest.fixture()
def client() -> TestClient:
    from app.main import create_app
    from app.settings import get_settings

    get_settings.cache_clear()  # type: ignore[attr-defined]
    return TestClient(create_app())
