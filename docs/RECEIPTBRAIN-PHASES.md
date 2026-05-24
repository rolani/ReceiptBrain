# ReceiptBrain — Phase Handbook (MVP monorepo)

## How to use

Type **`implement phase X`** (0–9) or run a matching slash command from `.cursor/commands/`.

The agent must:

1. Read the matching `## Phase X` section below
2. Follow `.cursor/rules/tdd-testing.mdc` (failing test first)
3. Ask only explicit `ASK:` questions in that phase
4. Run verification commands before marking the phase complete

## Global rules

- **Stack** (do not substitute): pnpm workspaces, Next.js App Router, Prisma + PostgreSQL, BullMQ + Redis, S3-compatible storage, Python FastAPI AI service, OpenAI Structured Outputs, NextAuth.js
- **Monorepo layout**: `apps/web`, `apps/worker`, `services/ai`, `packages/ui`, `packages/lib`, `packages/contracts`, `fixtures/receipts`
- **Contract-first**: stable receipt/item/subscription/insight shapes in `packages/contracts`; validate at every API boundary
- **Money is Decimal**: never `Float` for money
- **Auth is MVP, not bonus**: every API route is session-protected from Phase 4
- **AI service is internal**: only the worker calls it, with `X-Internal-Token`
- **Workers are a separate process**: `apps/worker` — not Next.js route handlers
- **TDD always**: RED → GREEN → run full relevant suites before success

## Canonical commands

From repo root:

```bash
pnpm install
docker compose up -d              # postgres, redis, minio, ai
pnpm run lint
pnpm run typecheck
pnpm run test                     # all JS/TS workspaces
cd services/ai && pytest tests -q
pnpm run test:e2e                 # when Phase 9
pnpm dev                          # web + worker (turbo)
```

By package:

```bash
pnpm --filter @receiptbrain/web test
pnpm --filter @receiptbrain/worker test
pnpm --filter @receiptbrain/lib test
pnpm --filter @receiptbrain/contracts test
```

If a command does not exist yet in Phase 0, **scaffold it first** before implementing behavior.

---

## Phase 0 — Monorepo scaffold & test tooling

### Goal

Working monorepo skeleton with lint, typecheck, test runners, local infra, and env validation.

### Scope

- Root: `pnpm-workspace.yaml`, `turbo.json`, `package.json` scripts
- `docker-compose.yml`: postgres, redis, minio, ai (FastAPI dev), web, worker
- `.env.example` with every var from `outline.md` (Auth, OpenAI models, AI token, Sentry, limits)
- `apps/web`: Next.js App Router, TS strict, Tailwind, ESLint, Prettier, Vitest, env validation via `@t3-oss/env-nextjs`, ≥1 passing test, `/api/health` route
- `apps/worker`: BullMQ worker process scaffold (just connects to Redis + logs), ≥1 passing test
- `packages/lib`: shared utils placeholder + ≥1 test
- `packages/ui`: shared primitive + ≥1 test (Testing Library)
- `packages/contracts`: Zod schemas + types + ≥1 test
- `services/ai`: FastAPI `/health`, pydantic-settings env, pytest with ≥1 passing test
- `fixtures/receipts/README.md` describing the format
- `.github/workflows/ci.yml`: lint + typecheck + test + ruff + pytest on PR
- Root README with setup steps

### Exit criteria

- `pnpm install` succeeds
- `pnpm run lint` passes
- `pnpm run typecheck` passes
- `pnpm run test` passes (web + worker + lib + ui + contracts)
- `cd services/ai && pytest tests -q` passes
- `docker compose up -d` starts postgres, redis, minio, ai
- CI green on a dummy PR (or local `act` run)

### ASK

None.

---

## Phase 1 — Database & Prisma

### Goal

PostgreSQL schema matching `outline.md` (Decimal money, indexes, enums, ExtractionAttempt, Merchant).

### Scope

- Prisma schema in `packages/lib/prisma`: User, Merchant, Receipt, Item, Subscription, Insight, ExtractionAttempt + all enums
- Migration applied against local Postgres via docker-compose
- `packages/lib` exports typed Prisma client
- Seed script with demo user + 20 receipts + 2 subscriptions + sample insights
- Tests: schema smoke (CRUD round-trip), seed idempotency, ownership scoping helper

### Exit criteria

- `pnpm --filter @receiptbrain/lib db:migrate` succeeds
- `pnpm --filter @receiptbrain/lib db:seed` runs without error
- `pnpm run test` still green including new DB tests

### ASK

None.

---

## Phase 2 — Storage & queue foundations

### Goal

S3-compatible upload abstraction with signed URLs, BullMQ queues, image preprocessing helpers.

### Scope

- `packages/lib`:
  - `storage`: S3 client (MinIO locally), private bucket, signed URL helpers
  - `queue`: BullMQ queue definitions (`extract_receipt`, `generate_insights`) with retry config
  - `image`: HEIC→JPEG, EXIF rotate, resize ≤2048px, PDF→first-page (sharp + pdf-poppler or pdfjs)
- Unit/integration tests for storage upload, signed URL TTL, queue enqueue, image preprocessing (fixture-based)
- MinIO bucket auto-created on docker boot via `minio-init`

### Exit criteria

- Tests prove file uploads to MinIO → signed URL → file downloads
- Queue enqueue + dequeue smoke test passes
- Image preprocessing converts HEIC/PDF fixtures to JPEG ≤2048px

### ASK

None.

---

## Phase 3 — Auth (MVP)

### Goal

NextAuth.js v5 with Resend email magic link; session-protected API + multi-tenancy enforcement.

### Scope

- `@auth/prisma-adapter` wired to existing User table; add Account/Session/VerificationToken models
- NextAuth route handler in `apps/web/app/api/auth/[...nextauth]/route.ts`
- `/sign-in` page with email magic link form
- `apps/web/lib/auth.ts`: `requireSession()` helper used by every API route
- Tests: unauthed request → 401; userA cannot read userB's receipt → 403; magic link flow (mocked Resend)

### Exit criteria

- All web tests pass, including multi-tenancy isolation tests
- Local sign-in works against MailHog or Resend test mode
- `/api/health` remains public; all other routes require session

### ASK

- Confirm Resend as the magic-link provider (default), or substitute (e.g. SES)?

---

## Phase 4 — Web API routes

### Goal

Session-protected Next.js route handlers with Zod validation, pagination, rate limiting, and tests.

### Scope

- `POST /api/upload`: multipart → MIME + size check → sha256 → dedup → S3 → Receipt row → enqueue `extract_receipt` → returns `{receiptId, status, jobId}`
- `GET /api/receipts` (cursor pagination + filters)
- `GET /api/receipts/:id`
- `GET /api/receipts/:id/image` (streams via signed URL; ownership-checked)
- `GET /api/receipts/:id/status` (polling)
- `PATCH /api/receipts/:id` (correction)
- `DELETE /api/receipts/:id` (soft delete)
- `GET /api/subscriptions`, `PATCH /api/subscriptions/:id`
- `GET /api/insights`, `PATCH /api/insights/:id`
- `POST /api/recommend` (enqueues `generate_insights`)
- Rate limit middleware (per-user, in-memory dev / Redis-backed prod)
- All Zod schemas live in `packages/contracts`

### Exit criteria

- Integration tests for every route (validation, ownership, side effects mocked)
- Rate-limit tests cover 429 path
- OpenAPI or contracts table documented (lightweight)

### ASK

None.

---

## Phase 5 — Web app shell & pages

### Goal

App shell + all routes from outline; components wired to React Query and contracts; empty/loading/error states.

### Scope

- Routes: `/`, `/(auth)/sign-in`, `/dashboard`, `/receipts`, `/receipts/[id]`, `/upload`, `/subscriptions`, `/insights`, `/settings`
- Components: Navbar, Sidebar, DashboardSummary (with date range), ReceiptUploader (drag/drop + camera), ReceiptList (paginated), ReceiptCard (confidence chip), ReceiptDetailEditor, InsightCard (with source receipts + dismiss/action), SubscriptionCard, EmptyState, ErrorBoundary
- React Query + Zustand wired; optimistic mutations for `PATCH /api/receipts/:id` and `PATCH /api/insights/:id`
- Component tests for key UI (Vitest + Testing Library)

### Exit criteria

- `pnpm --filter @receiptbrain/web build` succeeds
- Component + page tests pass
- Manual smoke: pages render without errors, empty states show, optimistic UI rolls back on simulated failure

### ASK

None.

---

## Phase 6 — AI service (FastAPI)

### Goal

Production-shaped `/extract` and `/recommend` endpoints with Structured Outputs, confidence, token usage, and internal auth.

### Scope

- FastAPI app with `X-Internal-Token` middleware (rejects non-worker callers)
- Pydantic request/response models matching `packages/contracts`
- `POST /extract`: preprocess → OpenAI Vision call with `response_format=json_schema` → return per-field confidence + token usage + cost estimate
- `POST /recommend`: aggregate-only input (no raw rows) → recommendation array with sources + confidence
- PII guard: regex + Luhn check strips PAN candidates from logs/breadcrumbs
- pytest with mocked OpenAI; fixture-driven `/extract` tests assert merchant/total within tolerance
- Contract test verifies response shape matches `packages/contracts`
- Sentry SDK + structlog initialized

### Exit criteria

- `cd services/ai && pytest tests -q` passes
- Fixture suite: ≥5 receipt images extract correctly within tolerance
- Internal-token test: missing/wrong token → 401

### ASK

- Default extraction model: `gpt-4o` (default) or another vision-capable model?

---

## Phase 7 — Queue workers

### Goal

`apps/worker` process implements both job handlers end-to-end with retries, idempotency, and observability.

### Scope

- `extract_receipt` handler:
  - download from S3 → preprocess → call `POST /extract` with `Idempotency-Key = receiptId`
  - persist `ExtractionAttempt` (raw JSON, usage, cost)
  - update Receipt fields + `fieldConfidence`
  - set `status = needs_review` if any critical field confidence < 0.7
  - debounce-enqueue `generate_insights` for this user
- `generate_insights` handler:
  - aggregate last 90 days (top merchants, monthly totals, recurring candidates) — pure function, unit-tested
  - call `POST /recommend`
  - upsert Insight rows (idempotent on userId + content fingerprint)
- Tests cover: happy path, AI timeout + retry, duplicate job idempotency, malformed payload, low-confidence path
- Bull Board mounted at `/admin/queues` (dev only, auth-protected)

### Exit criteria

- Worker tests pass
- Manual: enqueue test job → Receipt row populated → Insight rows created

### ASK

None.

---

## Phase 8 — Core business logic & explainability

### Goal

Merchant normalization, subscription detection, and insight wiring — all pure-function and exhaustively tested.

### Scope

- Merchant normalization: strip store numbers, lowercase, Jaro-Winkler match against existing `Merchant` rows
- Subscription detection: ≥3 occurrences with consistent interval (±15%) and amount (±10%); compute `confidence`, `nextChargeEstimate`
- Insight generators bundled with sources (`sourceReceiptIds`, `sourceSubscriptionId`) — UI must render "based on N receipts"
- Heuristic `spending_spike` detector (>2σ above 90-day mean for category)
- Unit tests for all pure functions: single receipt, irregular interval, amount drift, duplicate, empty input edge cases

### Exit criteria

- Pure-logic test coverage ≥90% on these modules
- Integration test: seed receipts in → Subscription + Insight rows out with expected confidence
- UI shows source receipts for every insight card

### ASK

None.

---

## Phase 9 — Observability, E2E, polish

### Goal

End-to-end confidence: upload → extract → dashboard insight. Sentry, health checks, CI green, optimistic UI, retry UX.

### Scope

- Sentry initialized in web, worker, AI (with scrubbing of receipt bodies/image URLs)
- Structured logs (`pino` web/worker, `structlog` AI) with requestId propagation
- `/api/health` returns `{ok, db, redis, ai, version}` — used by docker healthcheck + uptime monitor
- Playwright E2E: sign in → upload demo fixture → poll status → see extracted receipt + insight
- Retry UX for failed extractions (`needs_review` state with "re-extract" button)
- README updated with full dev workflow + deployment notes

### Exit criteria

- `pnpm run test:e2e` passes
- Full `pnpm run test` + pytest green
- `pnpm dev` runs web + worker; `docker compose up` runs everything including AI
- CI workflow green on a real PR

### ASK

- E2E runner preference if not preset: Playwright (default) vs Cypress?
