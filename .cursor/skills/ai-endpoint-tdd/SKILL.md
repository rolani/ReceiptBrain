---
name: ai-endpoint-tdd
description: Adds FastAPI extract/recommend endpoints test-first with Structured Outputs, internal-token auth, mocked OpenAI, and fixture extraction. Use when building or changing services/ai.
---

# AI Endpoint TDD

## Steps

1. Define Pydantic request/response models matching `packages/contracts`
2. Write pytest in `services/ai/tests/`:
   - `monkeypatch` the OpenAI client (or use `dependency_overrides`) to return a fixture response
   - assert response shape, confidence values, `usage` populated
   - assert `X-Internal-Token` enforcement (missing/wrong → 401)
3. Confirm RED
4. Implement route in `services/ai/app/`:
   - require `X-Internal-Token` via FastAPI dependency
   - use OpenAI Structured Outputs (`response_format={"type":"json_schema", "json_schema": {...}}`)
   - preprocess image (HEIC, EXIF, resize, PDF) if applicable
   - emit `usage.promptTokens`, `usage.completionTokens`, `usage.costUsdEstimate`
5. Run `cd services/ai && pytest tests -q` until GREEN

## Required tests

- `/extract`: valid image → structured merchant/items response with `fieldConfidence`
- `/extract`: invalid input → 422
- `/extract`: missing/wrong `X-Internal-Token` → 401
- `/extract`: fixture-driven — for each `fixtures/receipts/<slug>.jpg`, the mocked OpenAI returns ground truth and pytest asserts shape matches
- `/recommend`: aggregate input → list with `type`, `title`, `estimatedSavings`, `currency`, `sourceReceiptIds`, `confidence`
- OpenAI failure → 502/503 with safe error body
- PII guard: PAN-like strings stripped from logged `extra={...}` (assert via captured log records)

## Mock pattern

```python
def test_extract_returns_merchant_and_confidence(client, mock_openai, ground_truth):
    mock_openai.chat.completions.parse.return_value = build_response(ground_truth)
    response = client.post(
        "/extract",
        headers={"X-Internal-Token": settings.AI_SERVICE_TOKEN},
        files={"file": ("r.jpg", img_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["merchant"] == "Starbucks"
    assert body["fieldConfidence"]["merchant"] >= 0.9
    assert body["usage"]["promptTokens"] > 0
```

## Contract alignment

Cross-check JSON keys with TypeScript types in `packages/contracts` used by `apps/worker`. Use a snapshot or shared schema test to catch drift.
