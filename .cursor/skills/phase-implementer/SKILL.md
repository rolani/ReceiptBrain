---
name: phase-implementer
description: Executes ReceiptBrain phase handbook (0–9) with TDD and exit-criteria verification. Use when the user says implement phase X, scaffold a phase, or build the monorepo incrementally.
---

# Phase Implementer

## Trigger

- `implement phase X` (X = 0–9)
- Slash command `/implement-phase`
- Incremental monorepo build requests referencing phases

## Workflow

1. Parse phase number `X` from the user message
2. Read [docs/RECEIPTBRAIN-PHASES.md](../../../docs/RECEIPTBRAIN-PHASES.md) → `## Phase X`
3. Collect unanswered `ASK:` items into one question block
4. For each scope item, run TDD:
   - failing test → verify failure reason → minimal code → green
5. Apply the relevant rules during implementation:
   - **Phase 1**: `prisma-database.mdc`
   - **Phase 2**: `queue-workers.mdc`, `security-auth.mdc` (signed URLs)
   - **Phase 3**: `security-auth.mdc`
   - **Phase 4**: `api-routes.mdc`, `security-auth.mdc`
   - **Phase 5**: `web-patterns.mdc`
   - **Phase 6**: `python-ai.mdc`
   - **Phase 7**: `queue-workers.mdc`, `observability.mdc`
   - **Phase 8**: `tdd-testing.mdc` (pure-function coverage)
   - **Phase 9**: `observability.mdc`
6. Run phase exit criteria + `/run-verification` before declaring complete

## Output template

```markdown
## Phase X complete

**Built**
- ...

**Verification**
- lint: pass/fail
- typecheck: pass/fail
- test: pass/fail
- pytest: pass/fail
- (phase-specific): ...

**Follow-ups**
- ...
```

## Defaults

- Prisma in `packages/lib/prisma`
- NextAuth.js + Resend for magic link
- OpenAI vision model: `gpt-4o` (extract), `gpt-4o-mini` (recommend) — overridable via env
- Playwright for E2E
- Workers in `apps/worker` (separate process)

## Drift handling

If handbook commands differ from repo scripts, use closest equivalent and note the drift in the phase report.
