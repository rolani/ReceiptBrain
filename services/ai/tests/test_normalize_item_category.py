"""Tests for `_normalize_item_category` — coerce LLM category dialects."""

from __future__ import annotations

from app.openai_client import _normalize_item_category


def test_passes_through_valid_enum():
    assert _normalize_item_category("groceries") == "groceries"
    assert _normalize_item_category("dining") == "dining"


def test_normalizes_case_insensitive_valid():
    assert _normalize_item_category("Groceries") == "groceries"
    assert _normalize_item_category(" DINING ") == "dining"


def test_invalid_store_aisle_labels_become_none():
    assert _normalize_item_category("Dairy") is None
    assert _normalize_item_category("Frozen") is None
    assert _normalize_item_category("Grocery") is None


def test_empty_and_non_string_become_none():
    assert _normalize_item_category("") is None
    assert _normalize_item_category("   ") is None
    assert _normalize_item_category(None) is None
    assert _normalize_item_category(123) is None
