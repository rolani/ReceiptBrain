# ReceiptBrain

AI-powered receipt intelligence web app. Upload receipts → structured extraction → subscription detection → actionable spending insights.

See [`outline.md`](outline.md) for the full product spec and [`docs/RECEIPTBRAIN-PHASES.md`](docs/RECEIPTBRAIN-PHASES.md) for the phased implementation handbook.

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | pnpm workspaces + turbo |
| Web | Next.js 15 (App Router) + TypeScript strict + Tailwind |
| State | TanStack React Query + Zustand + RHF + Zod |
| API | Next.js route handlers (Zod-validated, session-protected) |
| Auth | NextAuth.js v5 + Resend magic link + optional Google OAuth |
| DB | PostgreSQL via Prisma (`Decimal` money, enums, indexes) |
| Queue | BullMQ + Redis (workers in `apps/worker`, separate process) |
| Storage | S3-compatible (MinIO local), private bucket + signed URLs (≤5 min TTL) |
| AI | Python FastAPI + OpenAI Vision (Structured Outputs) |
| Tests | Vitest + Testing Library + pytest + Playwright (E2E) |

## Prerequisites

- Node 20+ (use [`.nvmrc`](.nvmrc) — `nvm use`)
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.15.4 --activate`, or use `npx pnpm@9`)
- Python 3.11+ (for `services/ai`)
- Docker + Docker Compose

## Setup

```bash
cp .env.example .env
pnpm install
docker compose up -d              # postgres, redis, minio, ai service
pnpm --filter @receiptbrain/lib db:migrate    # apply migrations
pnpm --filter @receiptbrain/lib db:seed       # demo user + 26 receipts + 2 subs + 3 insights
pnpm dev                           # web + worker via turbo
```

Defaults:

- Web → http://localhost:3000
- AI service → http://localhost:8000 (internal; requires `X-Internal-Token`)
- MinIO console → http://localhost:9001 (`receiptbrain` / `receiptbrain-secret`)
- Postgres → `localhost:5432` · Redis → `localhost:6379`

Demo user after seed: `demo@receiptbrain.app` (sign in via the magic-link form with that address; the magic link is sent through Resend in production but logged to the dev console when `RESEND_API_KEY` is the test key).

## Workspace layout

```
apps/
  web/        Next.js App Router (UI + API routes + Playwright E2E)
  worker/     BullMQ worker (extract_receipt, generate_insights)
services/
  ai/         Python FastAPI (extract + recommend; internal-only)
packages/
  ui/         Shared React primitives (Button, EmptyState)
  lib/        Prisma client, storage, queue, image preprocessing,
              domain logic (merchant/subscription/spike), Sentry scrub
  contracts/  Zod schemas + shared TS types (mirrors Pydantic models in ai)
fixtures/
  receipts/   Sample images + ground-truth JSON for AI extraction tests
docs/         RECEIPTBRAIN-PHASES.md (the phased implementation handbook)
```

## Verification

```bash
pnpm run lint
pnpm run typecheck
pnpm run test                              # all JS/TS workspaces
cd services/ai && pytest tests -q          # Python AI service
pnpm --filter @receiptbrain/web build      # production Next.js build
pnpm --filter @receiptbrain/web test:e2e   # Playwright (requires the web server)
```

CI mirrors these in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). The lib package's database integration tests skip gracefully if Postgres is unreachable — provision a `postgres` service in CI to exercise them.

## Phases

Implement incrementally with `implement phase X` (see [`docs/RECEIPTBRAIN-PHASES.md`](docs/RECEIPTBRAIN-PHASES.md)):

- **0** — Monorepo scaffold
- **1** — Prisma schema + seed
- **2** — Storage (S3/MinIO) + queues (BullMQ) + image preprocessing
- **3** — Auth (NextAuth v5 + Resend magic link) + `requireSession`
- **4** — API routes (upload, receipts, subscriptions, insights, recommend) + rate limits
- **5** — Web app shell, pages, React Query, optimistic mutations
- **6** — AI FastAPI service (`/extract`, `/recommend`) with Structured Outputs + PII guard
- **7** — Workers (extract_receipt, generate_insights) + retries + idempotency
- **8** — Business logic: merchant normalization, subscription detection, spike detection
- **9** — Observability, `/api/health`, Playwright E2E, retry UX, this README

## Operations

### Re-running extraction on a stuck receipt

`POST /api/receipts/:id/reextract` re-enqueues the job (jobId = receiptId, so concurrent clicks coalesce). The UI surfaces this on receipts in `failed` or `needs_review` state.

### Generating new insights

`POST /api/recommend` enqueues `generate_insights` for the current user (10/hr/user rate limit). The job is idempotent — the same set of inputs produces the same `contentFingerprint` and unique-violates on second insert.

### Health

`GET /api/health` returns `{ok, checks: {db, redis, ai}}`. Returns 503 if any dependency is down — wire it to your uptime monitor and Docker healthcheck.

## License

MIT
