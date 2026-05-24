---
description: Add a Next.js API route with TDD (auth + Zod + ownership tests)
---

Follow `api-routes.mdc`, `security-auth.mdc`, `tdd-testing.mdc`, and `.cursor/skills/api-route-tdd/SKILL.md`.

**User request** (fill in): method + path, request/response shape, side effects (S3, queue, DB).

**Do:**

1. Add or extend the Zod schema in `packages/contracts`
2. Write failing integration tests first:
   - 401 unauthed, 403 cross-user, 400 invalid input, happy path, side effects asserted
3. Implement the handler with `requireSession()` + ownership-scoped Prisma queries
4. Wire S3 / BullMQ / Prisma from `@receiptbrain/lib`
5. Add rate limit if endpoint is upload- or AI-triggering
6. Run `pnpm --filter @receiptbrain/web test` until green

**Output**: route file path, test file path, contracts diff, example curl
