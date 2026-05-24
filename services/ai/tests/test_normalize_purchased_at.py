"""Tests for `_normalize_purchased_at` — the AI-side date hardener.

Asserts that common LLM date dialects are coerced to ISO 8601 UTC strings,
and that anything unparseable becomes '' (which the worker treats as None).
"""

from __future__ import annotations

from app.openai_client import _normalize_purchased_at


def test_passes_through_iso_z():
    assert _normalize_purchased_at("2026-05-22T15:04:00Z") == "2026-05-22T15:04:00Z"


def test_normalizes_offset_to_z():
    assert _normalize_purchased_at("2026-05-22T15:04:00+00:00") == "2026-05-22T15:04:00Z"


def test_date_only_becomes_midnight_utc():
    assert _normalize_purchased_at("2026-05-22") == "2026-05-22T00:00:00Z"


def test_us_slash_date():
    assert _normalize_purchased_at("05/22/2026") == "2026-05-22T00:00:00Z"


def test_us_slash_datetime_12h():
    assert _normalize_purchased_at("05/22/2026 3:04 PM") == "2026-05-22T15:04:00Z"


def test_unknown_returns_empty_string():
    assert _normalize_purchased_at("Unknown") == ""


def test_empty_returns_empty():
    assert _normalize_purchased_at("") == ""
    assert _normalize_purchased_at("   ") == ""


def test_none_returns_empty():
    assert _normalize_purchased_at(None) == ""


def test_non_string_returns_empty():
    assert _normalize_purchased_at(12345) == ""
