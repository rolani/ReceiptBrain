You are a staff full-stack engineer. Generate a complete, production-ready monorepo for an AI-powered receipt intelligence web app.

GOAL
Build a web app that:
- lets users upload receipts (drag/drop + mobile camera capture)
- extracts structured data with field-level confidence (merchant, items, prices, tax, totals)
- detects subscriptions with source receipts and confidence
- generates actionable, explainable spending recommendations
- shows insights in a clean dashboard with status (new/seen/dismissed/actioned)

STACK (must follow exactly)
- Monorepo: pnpm workspaces + turbo
- Web: Next.js (App Router) + TypeScript (strict)
- Styling: Tailwind CSS
- State: React Query + Zustand
- Forms: React Hook Form + Zod
- Backend: Next.js route handlers (API routes)
- ORM: Prisma (Decimal for money)
- DB: PostgreSQL
- Queue: BullMQ + Redis
- File storage: S3-compatible (use abstraction); private bucket + signed URLs
- AI service: Python FastAPI (separate service)
- OpenAI for extraction + recommendations (vision model via Structured Outputs)
- Auth: NextAuth.js (email magic link via Resend) — MVP, not bonus
- Env validation: @t3-oss/env-nextjs (web) + pydantic-settings (AI)
- Error tracking: Sentry (web + worker + AI)

REPO STRUCTURE

/apps
  /web         (Next.js app — UI + API routes)
  /worker      (BullMQ worker — separate Node process; cannot live in Next.js handlers)
/services
  /ai          (FastAPI service)
/packages
  /ui          (shared UI components, Storybook-friendly)
  /lib         (shared utils: db client, auth, queue, storage, env, logger)
  /contracts   (shared Zod schemas + TS types for API payloads)
/fixtures
  /receipts    (sample images + ground-truth JSON for AI tests)

Include root configs:
- pnpm-workspace.yaml
- turbo.json
- docker-compose.yml (Postgres + Redis + MinIO + web + worker + ai services)
- .env.example
- .github/workflows/ci.yml (lint + typecheck + test + pytest on PR)

--------------------------------------------------
WEB APP REQUIREMENTS (/apps/web)

SETUP
- Next.js App Router
- TypeScript strict mode
- Tailwind configured
- ESLint + Prettier
- Vitest + Testing Library
- Env validation at boot (`@t3-oss/env-nextjs`) — fail fast on missing vars

ROUTES

/app
  /page.tsx                  (homepage - simple landing)
  /(auth)/sign-in/page.tsx   (magic link sign-in)
  /dashboard/page.tsx
  /receipts/page.tsx
  /receipts/[id]/page.tsx    (single receipt: items + correction UI)
  /upload/page.tsx
  /subscriptions/page.tsx
  /insights/page.tsx
  /settings/page.tsx

COMPONENTS (create in /components; primitives in @receiptbrain/ui)
- ReceiptUploader (drag/drop + <input capture="environment"> for mobile)
- ReceiptList (paginated, filterable by merchant/date/amount)
- ReceiptCard (shows extraction confidence chip)
- ReceiptDetailEditor (correct merchant/total/items inline)
- InsightCard (label + reasoning + source receipts + primary action + dismiss)
- SubscriptionCard (status, next charge estimate, source receipts)
- DashboardSummary (date-range filter)
- EmptyState (zero-receipts, zero-insights variants)
- ErrorBoundary + retry UI
- Navbar
- Sidebar

STATE
- React Query for server data (with optimistic mutations for corrections)
- Zustand for UI state (uploader, drawers, date range)

--------------------------------------------------
DATABASE (Prisma)

Notes:
- Use `Decimal` for all money fields (Float causes rounding errors)
- All models have `createdAt` + `updatedAt`
- Add indexes on FK + common query columns
- `deletedAt` for soft delete where users can remove data

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  receipts      Receipt[]
  subscriptions Subscription[]
  insights      Insight[]
}

model Merchant {
  id           String   @id @default(cuid())
  // Canonical name after normalization (e.g. "STARBUCKS #1234" -> "Starbucks")
  canonicalName String  @unique
  category     String?
  createdAt    DateTime @default(now())

  receipts      Receipt[]
  subscriptions Subscription[]
}

model Receipt {
  id              String    @id @default(cuid())
  userId          String
  merchantId      String?
  // Original freetext merchant from receipt; merchantId is the normalized link
  rawMerchant     String?
  imageUrl        String    // S3 key; never a public URL
  imageHash       String    // sha256 of original file — used for dedup
  imageMime       String
  imageBytes      Int
  status          ReceiptStatus @default(uploaded)
  total           Decimal?  @db.Decimal(12, 2)
  subtotal        Decimal?  @db.Decimal(12, 2)
  tax             Decimal?  @db.Decimal(12, 2)
  tip             Decimal?  @db.Decimal(12, 2)
  currency        String?   // ISO-4217
  purchasedAt     DateTime?
  paymentLast4    String?
  // Per-field confidences (0..1) returned by AI; used to drive review UI
  fieldConfidence Json?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  items           Item[]
  extractions     ExtractionAttempt[]
  user            User      @relation(fields: [userId], references: [id])
  merchant        Merchant? @relation(fields: [merchantId], references: [id])

  @@unique([userId, imageHash])     // dedup
  @@index([userId, purchasedAt])
  @@index([userId, status])
}

enum ReceiptStatus {
  uploaded
  extracting
  extracted
  failed
  needs_review
}

model Item {
  id          String   @id @default(cuid())
  receiptId   String
  lineNumber  Int
  name        String
  unitPrice   Decimal  @db.Decimal(12, 2)
  quantity    Int      @default(1)
  lineTotal   Decimal  @db.Decimal(12, 2)
  category    ItemCategory?
  confidence  Float?

  receipt     Receipt  @relation(fields: [receiptId], references: [id])

  @@index([receiptId])
}

enum ItemCategory {
  groceries
  dining
  transport
  software
  entertainment
  utilities
  household
  health
  travel
  other
}

model Subscription {
  id                String   @id @default(cuid())
  userId            String
  merchantId        String
  amount            Decimal  @db.Decimal(12, 2)
  currency          String
  interval          SubscriptionInterval
  firstCharge       DateTime
  lastCharge        DateTime
  nextChargeEstimate DateTime?
  confidence        Float    // 0..1 — derived from frequency + amount stability
  status            SubscriptionStatus @default(active)
  sourceReceiptIds  String[] // FK array; render "based on N receipts" in UI

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id])
  merchant          Merchant @relation(fields: [merchantId], references: [id])

  @@unique([userId, merchantId, interval])
  @@index([userId, status])
}

enum SubscriptionInterval {
  weekly
  monthly
  quarterly
  yearly
}

enum SubscriptionStatus {
  active
  paused
  cancelled
  unconfirmed
}

model Insight {
  id                  String   @id @default(cuid())
  userId              String
  type                InsightType
  title               String
  description         String
  estimatedSavings    Decimal? @db.Decimal(12, 2)
  currency            String?
  action              Json?    // structured CTA: {label, kind, target}
  status              InsightStatus @default(new)
  // Explainability — every insight links back to its sources
  sourceReceiptIds    String[]
  sourceSubscriptionId String?
  modelVersion        String?
  promptVersion       String?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user                User @relation(fields: [userId], references: [id])

  @@index([userId, type, status])
  @@index([userId, status, createdAt])
}

enum InsightType {
  cheaper_alternative
  subscription_waste
  spending_spike
  optimization_tip
}

enum InsightStatus {
  new
  seen
  dismissed
  actioned
}

// Raw + normalized extraction history per receipt. Lets us reprocess when
// prompts/models improve, debug failures, and track AI cost.
model ExtractionAttempt {
  id              String   @id @default(cuid())
  receiptId       String
  modelName       String   // e.g. "gpt-4o-2024-11-20"
  promptVersion   String   // e.g. "extract-v3"
  rawJson         Json     // raw structured-output response
  status          ExtractionStatus
  errorMessage    String?
  promptTokens    Int?
  completionTokens Int?
  costUsdEstimate Decimal? @db.Decimal(10, 4)
  durationMs      Int?
  createdAt       DateTime @default(now())

  receipt         Receipt  @relation(fields: [receiptId], references: [id])

  @@index([receiptId, createdAt])
}

enum ExtractionStatus {
  success
  partial
  failed
}

--------------------------------------------------
API ROUTES (Next.js)

All routes:
- Validate inputs with Zod schemas from @receiptbrain/contracts
- Enforce session ownership (user can only touch their own data)
- Use cursor- or page-based pagination on list endpoints
- Rate-limited (especially `/api/upload` and `/api/recommend`)

POST /api/upload
- multipart file upload (image/jpeg, image/png, image/heic, application/pdf; ≤ 10 MB)
- computes sha256 → dedup against `Receipt.imageHash` for this user
- writes to S3 (private bucket), creates Receipt row in `uploaded` state
- enqueues `extract_receipt` job (idempotencyKey = receiptId)
- returns `{ receiptId, status, jobId }`

GET /api/receipts?cursor=&limit=&merchant=&from=&to=
GET /api/receipts/:id
PATCH /api/receipts/:id          // user correction (merchant/total/items)
DELETE /api/receipts/:id         // soft delete
GET /api/receipts/:id/image      // streams via signed URL — never public
GET /api/receipts/:id/status     // polling endpoint for upload progress

GET /api/subscriptions
PATCH /api/subscriptions/:id     // status: cancel/pause/confirm

GET /api/insights?type=&status=&cursor=&limit=
PATCH /api/insights/:id          // status: seen/dismissed/actioned

POST /api/recommend              // enqueues `generate_insights` job; returns jobId

GET /api/health                  // liveness/readiness (db + redis + ai service ping)

--------------------------------------------------
QUEUE SYSTEM

Use BullMQ. Workers run in `apps/worker` (separate Node process; NOT inside Next.js handlers).

Queues:
- extract_receipt
- generate_insights

Workers:
- `extract_receipt`:
  - download image from S3 → preprocess (HEIC→JPEG, EXIF rotate, resize ≤2048px, PDF→first page)
  - call AI service `/extract` with `Idempotency-Key`
  - persist ExtractionAttempt + populate Receipt fields (or set `needs_review` if low confidence)
  - on completion, enqueue `generate_insights` for this user (debounced)
- `generate_insights`:
  - aggregate last 90 days (top merchants, monthly totals, candidate recurrences)
  - run subscription detection (rules + merchant normalization)
  - call AI service `/recommend` with the aggregate (NOT raw rows)
  - upsert Insight rows; mark new ones `status = new`

Cross-cutting:
- Idempotent handlers keyed on receiptId or (userId, day)
- Retries with exponential backoff (max 5)
- Failure → row stays in `failed`/`needs_review` with surfaced error
- Bull Board mounted in dev for debugging

--------------------------------------------------
AI SERVICE (/services/ai)

FastAPI app. Env-validated via pydantic-settings. Internal-only — requires `X-Internal-Token` header matching `AI_SERVICE_TOKEN` (the worker sends this).

PIPELINE
1. Image preprocessing (Pillow): HEIC→JPEG, EXIF rotation, max 2048px, JPEG quality 85.
2. OpenAI Vision call using **Structured Outputs** (`response_format={"type": "json_schema", "json_schema": ...}`).
3. PII guard: strip detected card PAN candidates (`\d{13,19}` matching Luhn) before logging.
4. Return Pydantic-validated response with per-field confidence (0..1).
5. Emit token usage + cost estimate in response metadata.

POST /extract
- input: multipart image (or `{image_url, signed}`); optional `prompt_version`
- output:
  {
    "merchant": "Starbucks",
    "rawMerchant": "STARBUCKS #1234",
    "currency": "USD",
    "subtotal": 12.40,
    "tax": 1.10,
    "tip": 0.00,
    "total": 13.50,
    "purchasedAt": "2026-05-22T15:04:00Z",
    "paymentLast4": "1234",
    "items": [
      {"name": "Latte", "unitPrice": 5.20, "quantity": 1, "lineTotal": 5.20, "category": "dining", "confidence": 0.96}
    ],
    "fieldConfidence": {"merchant": 0.98, "total": 0.99, "purchasedAt": 0.91, "items": 0.93},
    "model": "gpt-4o-2024-11-20",
    "promptVersion": "extract-v3",
    "usage": {"promptTokens": 1820, "completionTokens": 340, "costUsdEstimate": 0.0091}
  }

POST /recommend
- input:
  {
    "windowDays": 90,
    "summary": {
      "topMerchants": [{"merchant": "Starbucks", "spend": 124.30, "visits": 21}],
      "monthlyTotals": [{"month": "2026-04", "total": 1230.10}],
      "recurringCandidates": [
        {"merchant": "Netflix", "amount": 15.99, "interval": "monthly", "lastCharge": "2026-05-01", "occurrences": 6}
      ]
    },
    "currency": "USD"
  }
- output:
  [
    {
      "type": "subscription_waste",
      "title": "Cancel unused Netflix",
      "description": "Charged 6 months in a row, no activity in last 60 days.",
      "estimatedSavings": 191.88,
      "currency": "USD",
      "action": {"label": "Cancel subscription", "kind": "external_link", "target": "https://netflix.com/cancel"},
      "sourceReceiptIds": ["..."],
      "sourceSubscriptionId": "...",
      "confidence": 0.86,
      "model": "gpt-4o-2024-11-20",
      "promptVersion": "recommend-v2"
    }
  ]

GET /health     // returns {ok, model, promptVersions}

TESTING
- pytest with mocked OpenAI client (do not call live OpenAI in CI)
- Fixture-driven: `/fixtures/receipts/*.jpg|json` ground truth → assert merchant/total/items within tolerance
- Contract test: response schema matches `packages/contracts` TS types

--------------------------------------------------
AUTH (MVP — not bonus)

- NextAuth.js v5 with Resend email-magic-link provider
- Sessions in Postgres (`@auth/prisma-adapter`)
- All API routes require session except `/api/health`
- Multi-tenancy: every Prisma query filters by `session.user.id`
- Tests assert userA cannot read userB's receipts (403)

--------------------------------------------------
SECURITY

- File validation: MIME sniff + size ≤ 10 MB + extension allowlist
- S3 bucket private; access only via signed URLs (≤ 5 min TTL)
- AI service reachable only via `AI_SERVICE_TOKEN` header from worker
- Rate limit `/api/upload` (30/hour/user) and `/api/recommend` (10/hour/user)
- Strip PII (card PANs) before sending to OpenAI
- No model training on user receipts (state in privacy policy)
- Sentry scrubs receipt bodies + image URLs from breadcrumbs

--------------------------------------------------
OBSERVABILITY

- Structured logging (`pino` for Node, `structlog` for Python) with requestId
- Sentry SDK initialized in web, worker, and AI service
- `/api/health` returns `{ok, db, redis, ai, version}`
- Token usage logged per extraction + recommendation
- BullMQ events mirrored to logs (`job:completed`, `job:failed`)

--------------------------------------------------
FRONTEND PAGES

DASHBOARD
- Date-range filter (default: last 30 days)
- Summary cards: total spend, # subscriptions, potential savings
- Recent insights (top 3, status = new)
- Empty state when no data

UPLOAD
- Drag/drop + mobile camera capture (`<input capture="environment">`)
- Live progress + status (`uploaded → extracting → extracted | needs_review | failed`)
- Retry on failure

RECEIPTS
- Paginated list with merchant/date filter
- Click → detail page with inline correction (PATCH on save)
- Show field-confidence chips; auto-highlight low-confidence fields

INSIGHTS
- Grouped by type, sortable by estimated savings
- Each card shows source receipts + dismiss/action buttons

SUBSCRIPTIONS
- Active vs cancelled tabs
- Confidence + next-charge estimate per row

--------------------------------------------------
CORE LOGIC

MERCHANT NORMALIZATION
- Strip store numbers, locations, trailing punctuation
- Lowercase + Levenshtein/Jaro-Winkler match against existing Merchant rows
- Optional: embedding similarity fallback for ambiguous cases

SUBSCRIPTION DETECTION (pure, unit-testable)
- Group receipts by normalized merchantId
- Detect recurring pattern: ≥3 occurrences with consistent interval (±15% tolerance) and amount (±10% tolerance)
- Compute `confidence` = f(occurrences, interval stability, amount stability)
- Estimate `nextCharge` = `lastCharge + median(intervals)`

INSIGHT TYPES
- cheaper_alternative
- subscription_waste
- spending_spike      (>2σ above 90-day mean for a category)
- optimization_tip

--------------------------------------------------
UI REQUIREMENTS

- Clean dashboard UI, card-based layout
- Responsive, mobile-first
- Loading skeletons with stable dimensions (no CLS)
- Error states with retry CTAs
- Empty states for first-time users
- Keyboard nav + alt text on receipt images (a11y)

--------------------------------------------------
ENV VARIABLES (.env.example)

# Core
DATABASE_URL=
REDIS_URL=
NODE_ENV=development

# Storage
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_FORCE_PATH_STYLE=true   # MinIO local dev

# AI service (internal)
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TOKEN=          # shared secret between worker and AI service

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL_EXTRACT=gpt-4o
OPENAI_MODEL_RECOMMEND=gpt-4o-mini

# Auth (NextAuth.js)
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
RESEND_API_KEY=
AUTH_EMAIL_FROM=

# Observability
SENTRY_DSN=
LOG_LEVEL=info

# Limits
MAX_UPLOAD_MB=10

--------------------------------------------------
DOCKER SETUP

docker-compose.yml with:
- postgres (with healthcheck)
- redis (with healthcheck)
- minio (S3) + `minio-init` to create bucket on first boot
- web (Next.js, depends on postgres+redis+minio)
- worker (BullMQ, depends on postgres+redis+ai)
- ai (FastAPI, depends on nothing external)

One command for dev: `docker compose up` boots everything.

--------------------------------------------------
TESTING (mandatory, TDD)

- Web: Vitest + Testing Library; route handler integration tests with mocked storage/queue/DB
- Lib/contracts: Vitest unit tests for normalization, subscription detection, env validation
- Worker: Vitest with mocked AI HTTP, Prisma, queue; cover retries + idempotency
- AI service: pytest with mocked OpenAI; fixture-driven extract tests
- E2E: Playwright — upload demo receipt → see extracted result → see insight
- CI: GitHub Actions runs lint + typecheck + test + pytest on every PR

--------------------------------------------------
CI (.github/workflows/ci.yml)

Jobs:
- node: pnpm install → lint → typecheck → test → build
- python: pip install services/ai/requirements.txt → ruff → pytest
- (optional) e2e: docker compose up → playwright test

--------------------------------------------------
SEED + FIXTURES

- `pnpm db:seed`: creates demo user with 20+ receipts across multiple merchants, 2 subscriptions, sample insights
- `/fixtures/receipts/`: 10–20 sample images with matching `.json` ground truth used by AI service tests
  - Example: `starbucks-01.jpg` + `starbucks-01.json` (expected `merchant`, `total`, `items`)

--------------------------------------------------
OUTPUT REQUIREMENTS

- Generate full file structure
- Include all key files with real code (not placeholders)
- Ensure project runs with:
  pnpm install
  docker compose up -d        # infra
  pnpm dev                    # web + worker (turbo)
  # AI service runs in docker-compose
- Include README with: prerequisites, env setup, dev workflow, test commands, fixture creation

Do NOT skip implementations. Build a working MVP-level system with auth, observability, and AI fixtures from day 1.
