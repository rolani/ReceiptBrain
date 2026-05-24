#!/usr/bin/env bash
# Validates .cursor setup for ReceiptBrain — run from repo root
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

errors=0
ok=0

check() {
  if [[ -e "$1" ]]; then
    echo -e "${GREEN}✓${NC} $1"
    ((ok++)) || true
  else
    echo -e "${RED}✗${NC} missing: $1"
    ((errors++)) || true
  fi
}

echo "ReceiptBrain .cursor setup validation"
echo "======================================"

# Rules — must match every file in .cursor/rules/
RULES=(
  project-architecture
  tdd-testing
  phase-runner
  web-patterns
  api-routes
  prisma-database
  python-ai
  queue-workers
  security-auth
  observability
)
for rule in "${RULES[@]}"; do
  check ".cursor/rules/${rule}.mdc"
done

# Commands
COMMANDS=(
  implement-phase
  run-verification
  add-api-route
  add-ai-endpoint
  add-worker-job
  add-ui-component
  add-ai-fixture
  scaffold-monorepo
)
for cmd in "${COMMANDS[@]}"; do
  check ".cursor/commands/${cmd}.md"
done

# Skills
SKILLS=(
  phase-implementer
  verification
  api-route-tdd
  ai-endpoint-tdd
  worker-tdd
  ai-fixtures
)
for skill in "${SKILLS[@]}"; do
  check ".cursor/skills/${skill}/SKILL.md"
done

# Required docs
check "docs/RECEIPTBRAIN-PHASES.md"
check "outline.md"

# Frontmatter sanity on rules
echo ""
echo "Frontmatter checks..."
for f in .cursor/rules/*.mdc; do
  if head -1 "$f" | grep -q '^---$'; then
    echo -e "${GREEN}✓${NC} $f has frontmatter"
    ((ok++)) || true
  else
    echo -e "${RED}✗${NC} $f missing YAML frontmatter"
    ((errors++)) || true
  fi
done

# Required-fields on always-on rules
echo ""
echo "Always-apply rule checks..."
ALWAYS_ON=(
  project-architecture
  tdd-testing
  phase-runner
  security-auth
  observability
)
for rule in "${ALWAYS_ON[@]}"; do
  f=".cursor/rules/${rule}.mdc"
  if grep -q '^alwaysApply: true' "$f"; then
    echo -e "${GREEN}✓${NC} $rule has alwaysApply: true"
    ((ok++)) || true
  else
    echo -e "${RED}✗${NC} $rule missing alwaysApply: true"
    ((errors++)) || true
  fi
done

# Skill metadata
echo ""
echo "Skill metadata checks..."
for f in .cursor/skills/*/SKILL.md; do
  if grep -q '^name:' "$f" && grep -q '^description:' "$f"; then
    echo -e "${GREEN}✓${NC} $f metadata ok"
    ((ok++)) || true
  else
    echo -e "${RED}✗${NC} $f missing name/description"
    ((errors++)) || true
  fi
done

# Phase handbook coverage — every phase 0–9 must exist
echo ""
echo "Phase handbook coverage..."
for n in 0 1 2 3 4 5 6 7 8 9; do
  if grep -q "^## Phase ${n} " docs/RECEIPTBRAIN-PHASES.md; then
    echo -e "${GREEN}✓${NC} Phase ${n} present"
    ((ok++)) || true
  else
    echo -e "${RED}✗${NC} Phase ${n} missing from handbook"
    ((errors++)) || true
  fi
done

# Outline must reference key concepts so rules stay grounded
echo ""
echo "Outline keyword checks..."
KEYWORDS=(
  "Decimal"
  "NextAuth"
  "Structured Outputs"
  "AI_SERVICE_TOKEN"
  "fixtures/receipts"
  "ExtractionAttempt"
  "apps/worker"
  "Sentry"
  "fieldConfidence"
  "signed URL"
)
for kw in "${KEYWORDS[@]}"; do
  if grep -qF "$kw" outline.md; then
    echo -e "${GREEN}✓${NC} outline.md references \"$kw\""
    ((ok++)) || true
  else
    echo -e "${RED}✗${NC} outline.md missing \"$kw\""
    ((errors++)) || true
  fi
done

echo ""
echo "======================================"
echo "Passed: $ok | Failed: $errors"
if [[ $errors -gt 0 ]]; then
  exit 1
fi
echo -e "${GREEN}All .cursor checks passed.${NC}"
