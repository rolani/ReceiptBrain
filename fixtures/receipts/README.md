# Receipt fixtures

Ground-truth data for the AI service extraction tests. See `.cursor/skills/ai-fixtures/SKILL.md` for the full workflow.

## Layout

```
fixtures/receipts/
├── README.md
├── <merchant-slug>-NN.{jpg|png|heic|pdf}
└── <merchant-slug>-NN.json
```

Naming: lowercase, hyphens. Each binary has a same-name `.json` partner.

## Ground-truth JSON shape

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
    {
      "name": "Latte",
      "unitPrice": 5.20,
      "quantity": 1,
      "lineTotal": 5.20,
      "category": "dining"
    }
  ]
}
```

## Tolerances used by tests

- `merchant`: exact after normalization
- `total`, `subtotal`, `tax`, `tip`: ±$0.01
- `currency`: exact
- `items.length`: exact
- `items[i].name`: case-insensitive contains
- `items[i].lineTotal`: ±$0.01
- `purchasedAt`: same day (UTC)

## PII

Real receipts often include names, addresses, and card last4. Before committing:

- Redact addresses and full names
- Replace card numbers with `0000`
- Prefer synthetic receipts whenever possible

## Adding a fixture

```bash
cp my-receipt.jpg fixtures/receipts/starbucks-01.jpg
$EDITOR fixtures/receipts/starbucks-01.json
# Add the slug to services/ai/tests/test_extract_fixtures.py
cd services/ai && pytest tests/test_extract_fixtures.py -q
```
