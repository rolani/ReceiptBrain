---
description: Run full verification suite (lint, typecheck, tests, pytest, build)
---

Follow `.cursor/skills/verification/SKILL.md`.

**Do:**

1. Ensure infra is up (if integration tests need it): `docker compose up -d`
2. From repo root, run in order (skip only if script missing — then report gap):
   - `pnpm run lint`
   - `pnpm run typecheck`
   - `pnpm run test`                          (web + worker + lib + ui + contracts)
   - `cd services/ai && pytest tests -q`
   - `pnpm --filter @receiptbrain/web build`
   - `pnpm run test:e2e`                      (if configured)
3. Report pass/fail per command with the first error excerpt
4. Confirm CI workflow `.github/workflows/ci.yml` exists and matches local commands

**Output**: verification table (command | status | notes)

**Rule**: do not claim "done" without showing green output for the affected layer.
