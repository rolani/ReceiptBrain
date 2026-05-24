#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="${CLOUDFLARE_TUNNEL_CONFIG:-$ROOT/cloudflared/config.yml}"
WEB_URL="${RECEIPTBRAIN_WEB_URL:-http://localhost:3000}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared is not installed."
  echo "Install: brew install cloudflared"
  echo "Docs:    docs/cloudflare-tunnel.md"
  exit 1
fi

if [[ ! -f "$CONFIG" ]]; then
  echo "Missing tunnel config: $CONFIG"
  echo "Run setup first:"
  echo "  cp cloudflared/config.example.yml cloudflared/config.yml"
  echo "  # edit tunnel UUID + credentials-file, then re-run"
  echo "Full guide: docs/cloudflare-tunnel.md"
  exit 1
fi

if ! curl -sf --max-time 2 "$WEB_URL/api/health" >/dev/null 2>&1; then
  echo "Warning: $WEB_URL is not responding."
  echo "Start the stack first:"
  echo "  docker compose up -d"
  echo "  pnpm dev"
  echo ""
  read -r -p "Continue anyway? [y/N] " ans
  [[ "${ans:-}" =~ ^[Yy]$ ]] || exit 1
fi

echo "Starting Cloudflare tunnel (config: $CONFIG)"
exec cloudflared tunnel --config "$CONFIG" run
