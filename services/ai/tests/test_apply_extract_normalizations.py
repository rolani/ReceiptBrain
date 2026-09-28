"""Tests for `_apply_extract_normalizations` on raw model payloads."""

from __future__ import annotations

from app.openai_client import _apply_extract_normalizations


def test_sanitizes_invalid_item_categories():
    payload = {
        "purchasedAt": "2026-05-22T15:04:00Z",
        "items": [
            {
                "name": "Milk",
                "unitPrice": 4.99,
                "quantity": 1,
                "lineTotal": 4.99,
                "category": "Dairy",
                "confidence": 0.9,
            },
            {
                "name": "Pizza",
                "unitPrice": 7.35,
                "quantity": 1,
                "lineTotal": 7.35,
                "category": "Frozen",
                "confidence": 0.88,
            },
            {
                "name": "Latte",
                "unitPrice": 5.2,
                "quantity": 1,
                "lineTotal": 5.2,
                "category": "dining",
                "confidence": 0.95,
            },
        ],
    }

    _apply_extract_normalizations(payload)

    assert payload["items"][0]["category"] is None
    assert payload["items"][1]["category"] is None
    assert payload["items"][2]["category"] == "dining"
