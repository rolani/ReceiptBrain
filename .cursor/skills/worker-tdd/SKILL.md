---
name: worker-tdd
description: Implements BullMQ job handlers in apps/worker test-first with mocked AI, Prisma, S3, and Redis. Use for extract_receipt and generate_insights workers.
---

# Worker TDD

## Steps

1. Define job payload type in `packages/contracts`
2. Write handler test with mocks for: AI HTTP client, Prisma, S3, queue.add
3. Confirm RED
4. Implement processor in `apps/worker/src/`:
   - download image from S3 → preprocess
   - call AI service with `X-Internal-Token` and `Idempotency-Key`
   - persist `ExtractionAttempt` (raw JSON + usage + cost)
   - update Receipt fields + `fieldConfidence`
   - set `Receipt.status` (`extracted` | `needs_review` | `failed`)
   - debounce-enqueue downstream jobs
5. Configure retry: exponential backoff, `attempts: 5`
6. Mirror BullMQ events to `pino` logs (`jobId`, `attempt`, `durationMs`)
7. Run `pnpm --filter @receiptbrain/worker test` until GREEN

## Minimum test matrix

| Scenario | Expected |
|----------|----------|
| Happy path | DB updated, ExtractionAttempt row, `generate_insights` enqueued |
| AI 5xx / timeout | Retry scheduled, no partial corrupt state |
| Duplicate jobId | Idempotent — handler runs without dup rows |
| Low confidence (<0.7) | `Receipt.status = needs_review`, fields still saved |
| Malformed AI response | Fail fast, no retry storm, ExtractionAttempt status=failed |
| Token usage | `attempt.promptTokens > 0`, `costUsdEstimate > 0` |

## Queues (outline)

- `extract_receipt`: image → AI `/extract` → Receipt + Items + ExtractionAttempt
- `generate_insights`: pre-aggregated user summary → AI `/recommend` → Insight rows

## Integration smoke (optional)

```bash
docker compose up -d
pnpm dev                  # web + worker
# trigger via POST /api/upload with a fixture image
```

Verify rows appear in Postgres and Bull Board shows the job completed.
