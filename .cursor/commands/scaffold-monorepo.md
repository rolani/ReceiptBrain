---
description: Scaffold Phase 0 monorepo from outline.md
---

Follow `docs/RECEIPTBRAIN-PHASES.md` Phase 0, `project-architecture.mdc`, `security-auth.mdc`, and `observability.mdc`.

**Do:**

1. Create pnpm workspace, turbo, `docker-compose.yml` (postgres + redis + minio + web + worker + ai), `.env.example` with all keys from `outline.md`
2. Scaffold:
   - `apps/web` (Next.js App Router + env validation + Vitest + `/api/health`)
   - `apps/worker` (BullMQ process + Vitest)
   - `services/ai` (FastAPI + pydantic-settings + pytest + `/health`)
   - `packages/lib` (Prisma client placeholder + Vitest)
   - `packages/ui` (component primitive + Vitest + Testing Library)
   - `packages/contracts` (Zod schemas + Vitest)
   - `fixtures/receipts/README.md`
3. Add `.github/workflows/ci.yml` running lint + typecheck + test + ruff + pytest
4. Each package gets ≥1 passing test
5. Verify Phase 0 exit criteria via `/run-verification`
6. Update root README with setup steps

Use `/implement-phase` with phase `0` if user wants the full TDD walkthrough explicitly.

**Output**: tree summary, verification results, dev startup commands
