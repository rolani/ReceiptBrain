"""Tests for the PII guard — strips PAN candidates before logging/sending."""

from __future__ import annotations

import pytest

from app.pii import luhn_valid, strip_pan_candidates


def test_luhn_valid_for_known_test_pan() -> None:
    # 4242 4242 4242 4242 is the Stripe test Visa — luhn-valid.
    assert luhn_valid("4242424242424242") is True
    assert luhn_valid("4242 4242 4242 4242") is True


def test_luhn_invalid_for_random_digits() -> None:
    assert luhn_valid("1234567890123456") is False


def test_strip_replaces_pan_with_redaction() -> None:
    txt = "Card ending 4242424242424242 used at checkout"
    out = strip_pan_candidates(txt)
    assert "4242424242424242" not in out
    assert "[REDACTED-PAN]" in out


def test_strip_leaves_non_pan_numbers_alone() -> None:
    txt = "Order 12345 totaled $13.50 on 2026-05-22"
    assert strip_pan_candidates(txt) == txt


@pytest.mark.parametrize(
    "value",
    [
        "5555 5555 5555 4444",  # Mastercard test (luhn valid)
        "378282246310005",  # AmEx test (luhn valid, 15 digits)
    ],
)
def test_strip_handles_multiple_card_brands(value: str) -> None:
    assert luhn_valid(value) is True
    assert "[REDACTED-PAN]" in strip_pan_candidates(f"PAN: {value}")
