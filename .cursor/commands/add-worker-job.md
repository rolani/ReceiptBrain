---
description: Add a BullMQ job handler in apps/worker with tests
---

Follow `queue-workers.mdc`, `observability.mdc`, `tdd-testing.mdc`, and `.cursor/skills/worker-tdd/SKILL.md`.

**User request** (fill in): queue name, job payload, processing steps.

**Do:**

1. Define job payload type in `packages/contracts`
2. Write failing worker test (mock AI HTTP, Prisma, S3, queue):
   - happy path, retry on AI failure, idempotency (duplicate jobId), low-confidence path, malformed payload
3. Implement handler in `apps/worker`:
   - persist `ExtractionAttempt` for every AI call (raw JSON + usage + cost)
   - set `Receipt.status` correctly (`extracted | needs_review | failed`)
   - debounce-enqueue downstream jobs where relevant
4. Add retry config (exponential backoff, max 5)
5. Mirror BullMQ events to logs via `pino`
6. Run `pnpm --filter @receiptbrain/worker test` until green

**Output**: worker file, test file, contracts diff, enqueue example
