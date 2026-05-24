"""PII guard — strip card PAN candidates before logging or sending to OpenAI.

Rule (security-auth.mdc): never let raw card numbers reach the model or breadcrumbs.
"""

from __future__ import annotations

import re

REDACTION = "[REDACTED-PAN]"

# 13-19 digit runs, optionally split by spaces or dashes (common on receipts).
_PAN_RE = re.compile(r"(?<!\d)(?:\d[\s-]?){13,19}(?!\d)")


def luhn_valid(value: str) -> bool:
    digits = [int(c) for c in value if c.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    checksum = 0
    parity = (len(digits) - 2) % 2
    for i, d in enumerate(digits[:-1]):
        if i % 2 == parity:
            d *= 2
            if d > 9:
                d -= 9
        checksum += d
    return (checksum + digits[-1]) % 10 == 0


def strip_pan_candidates(text: str) -> str:
    if not text:
        return text

    def replacer(match: re.Match[str]) -> str:
        candidate = match.group(0)
        if luhn_valid(candidate):
            return REDACTION
        return candidate

    return _PAN_RE.sub(replacer, text)
