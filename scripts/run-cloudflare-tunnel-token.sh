#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_URL="${RECEIPTBRAIN_WEB_URL:-http://localhost:3000}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "Install cloudflared: brew install cloudflared"
  exit 1
fi

if [[ -z "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARE_TUNNEL_TOKEN from the Cloudflare dashboard:"
  echo "  Zero Trust → Networks → Connectors → Cloudflare Tunnels → [your tunnel]"
  echo "  → copy the 'cloudflared tunnel run --token ...' command"
  echo ""
  echo "  export CLOUDFLARE_TUNNEL_TOKEN='eyJ...'"
  echo "  pnpm run tunnel:token"
  exit 1
fi

if ! curl -sf --max-time 2 "$WEB_URL/api/health" >/dev/null 2>&1; then
  echo "Warning: $WEB_URL is not responding. Start: docker compose up -d && pnpm dev"
  read -r -p "Continue anyway? [y/N] " ans
  [[ "${ans:-}" =~ ^[Yy]$ ]] || exit 1
fi

echo "Starting dashboard-managed tunnel..."
exec cloudflared tunnel run --token "$CLOUDFLARE_TUNNEL_TOKEN"
