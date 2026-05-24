---
description: Add a receipt fixture with ground truth for AI extraction tests
---

Follow `.cursor/skills/ai-fixtures/SKILL.md` and `python-ai.mdc`.

**User request** (fill in): receipt image path or description (merchant, items, total).

**Do:**

1. Place the image at `fixtures/receipts/<slug>.{jpg,png,heic,pdf}` (slug = `merchant-NN`, lowercase, hyphens)
2. Create `fixtures/receipts/<slug>.json` with the ground-truth shape:
   ```json
   {
     "merchant": "Starbucks",
     "rawMerchant": "STARBUCKS #1234",
     "currency": "USD",
     "subtotal": 12.40,
     "tax": 1.10,
     "total": 13.50,
     "purchasedAt": "2026-05-22T15:04:00Z",
     "items": [
       {"name": "Latte", "unitPrice": 5.20, "quantity": 1, "lineTotal": 5.20, "category": "dining"}
     ]
   }
   ```
3. Add the slug to `services/ai/tests/test_extract_fixtures.py` parametrized list
4. Run `cd services/ai && pytest tests/test_extract_fixtures.py -q` — must pass against mocked OpenAI returning the same shape
5. (Optional) Add an E2E case in Playwright that uploads this fixture

**PII guard**: redact card PANs, full names, and addresses from real receipts before committing. Use synthetic data when possible.

**Output**: fixture files added, test parametrization diff, pytest result
