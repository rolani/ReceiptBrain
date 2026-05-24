#!/usr/bin/env bash
# Expose local Next.js via https://localhost.run (SSH reverse tunnel, no signup).
# Requires ~/.ssh/id_ed25519 (or id_rsa). Run `ssh-keygen -t ed25519` once if missing.
set -euo pipefail

PORT="${LOCALHOST_RUN_PORT:-3000}"
HOST="${LOCALHOST_RUN_HOST:-localhost.run}"

if ! ls ~/.ssh/id_ed25519 ~/.ssh/id_rsa >/dev/null 2>&1; then
  echo "No SSH key found. Generate one with:"
  echo "  ssh-keygen -t ed25519 -N \"\" -f ~/.ssh/id_ed25519"
  exit 1
fi

echo "Starting localhost.run tunnel → http://localhost:${PORT}"
echo "Press Ctrl+C to stop."
echo ""

ssh \
  -o StrictHostKeyChecking=accept-new \
  -o ServerAliveInterval=60 \
  -R "80:localhost:${PORT}" \
  "${HOST}" \
  -- --output json 2>&1 | while IFS= read -r line; do
    if [[ "$line" == "{"* ]]; then
      url="$(
        printf '%s' "$line" | python3 -c "
import json, sys, re
try:
    d = json.load(sys.stdin)
except json.JSONDecodeError:
    sys.exit(0)
msg = d.get('message') or ''
m = re.search(r'https://[a-z0-9.-]+\\.(?:lhr\\.life|localhost\\.run)', msg)
if m:
    print(m.group(0))
elif d.get('address'):
    print(f\"https://{d['address']}\")
" 2>/dev/null || true
      )"
      if [[ -n "$url" ]]; then
        echo ""
        echo "Public URL: $url"
        echo "Set NEXTAUTH_URL=$url in .env and restart pnpm dev for magic links."
        echo ""
      fi
    elif [[ "$line" != *$'\033'* ]]; then
      printf '%s\n' "$line"
    fi
  done
