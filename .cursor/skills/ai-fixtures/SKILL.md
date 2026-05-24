---
name: ai-fixtures
description: Manages receipt fixtures (image + ground-truth JSON) under fixtures/receipts/ for AI extraction tests. Use when adding new test receipts, debugging extraction regressions, or evaluating prompt changes.
---

# AI Fixtures

Fixture-driven tests are the only way to know `/extract` actually works. Every prompt change should be validated against the fixture suite.

## Directory layout

```
fixtures/receipts/
├── README.md
├── starbucks-01.jpg
├── starbucks-01.json
├── netflix-invoice-01.pdf
├── netflix-invoice-01.json
└── ...
```

Naming: `<merchant-slug>-NN.{jpg|png|heic|pdf}` (lowercase, hyphens). Pair each binary with the same-slug `.json`.

## Ground-truth JSON shape

Mirror the `/extract` response (minus model metadata):

```json
{
  "merchant": "Starbucks",
  "rawMerchant": "STARBUCKS #1234 SEATTLE WA",
  "currency": "USD",
  "subtotal": 12.40,
  "tax": 1.10,
  "tip": 0.00,
  "total": 13.50,
  "purchasedAt": "2026-05-22T15:04:00Z",
  "paymentLast4": "1234",
  "items": [
    {"name": "Latte", "unitPrice": 5.20, "quantity": 1, "lineTotal": 5.20, "category": "dining"}
  ]
}
```

## Tolerances (assertions)

- `merchant`: exact match (after normalization)
- `total`, `subtotal`, `tax`, `tip`: within ±$0.01
- `currency`: exact
- `items` length: exact
- `items[i].name`: case-insensitive contains
- `items[i].lineTotal`: within ±$0.01
- `purchasedAt`: same day (ignore time-of-day in tolerance)

## Adding a fixture

1. Place the image at `fixtures/receipts/<slug>.{ext}` (use synthetic data if real receipts contain PII)
2. Create matching `<slug>.json` with the shape above
3. Add `<slug>` to the parametrized list in `services/ai/tests/test_extract_fixtures.py`
4. Run `cd services/ai && pytest tests/test_extract_fixtures.py -q`

## PII

Real receipts contain names, addresses, card last4, sometimes full PANs. Before committing:

- Redact addresses and full names (sharpie or image editor)
- Replace card numbers with `0000` digits
- Prefer synthetic receipts (generate via templating) when possible

## Prompt change workflow

When you change `extract` prompt or upgrade `OPENAI_MODEL_EXTRACT`:

1. Bump `promptVersion` in the AI service
2. Re-run the fixture suite — every fixture must still pass
3. If a fixture regresses, either fix the prompt or update the ground truth (with justification in PR description)
4. Update CHANGELOG (or commit body) with the model/prompt version diff
