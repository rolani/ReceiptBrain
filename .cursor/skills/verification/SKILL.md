---
name: verification
description: Runs lint, typecheck, tests, pytest, and build before claiming work complete. Use before finishing any task, after implementing a phase, or when the user asks to verify or run tests.
---

# Verification

## When to use

- Before marking any implementation "done"
- After phase completion
- User asks "does it work?", "run tests", or `/run-verification`

## Checklist

Run from repo root (skip missing scripts — report as gap):

```bash
pnpm run lint
pnpm run typecheck
pnpm run test                              # web + worker + lib + ui + contracts
cd services/ai && pytest tests -q
pnpm --filter @receiptbrain/web build
```

Optional when present:

```bash
pnpm run test:e2e
docker compose ps                          # if integration tests need infra
```

## Infra prerequisite

If tests need Postgres / Redis / MinIO / AI:

```bash
docker compose up -d
cp .env.example .env     # if .env missing
```

## CI parity

`/run-verification` must mirror `.github/workflows/ci.yml`. If they drift, update CI or local scripts so both pass.

## Report format

| Command | Status | Notes |
|---------|--------|-------|
| lint | ✅/❌ | first error if fail |
| typecheck | ✅/❌ | |
| test (web/worker/lib/ui/contracts) | ✅/❌ | per-package breakdown |
| pytest | ✅/❌ | including fixture extract tests |
| build | ✅/❌ | |
| e2e | ✅/❌/skipped | |

**Rule**: no success claim without executed commands and observed output.
