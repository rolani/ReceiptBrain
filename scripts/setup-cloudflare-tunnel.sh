#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$ROOT/cloudflared/config.yml"
EXAMPLE="$ROOT/cloudflared/config.example.yml"
HOSTNAME="${RECEIPTBRAIN_PUBLIC_HOST:-receiptbrain.richolaniyan.com}"

echo "ReceiptBrain — Cloudflare Tunnel setup"
echo "Public hostname: $HOSTNAME"
echo ""

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "Installing cloudflared via Homebrew..."
  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew required. Install from https://brew.sh then re-run."
    exit 1
  fi
  brew install cloudflared
fi

echo "Step 1/4 — Log in to Cloudflare (browser opens)"
cloudflared tunnel login

echo ""
echo "Step 2/4 — Create tunnel named 'receiptbrain'"
cloudflared tunnel create receiptbrain || true

CRED_DIR="${HOME}/.cloudflared"
TUNNEL_JSON="$(ls -t "$CRED_DIR"/*.json 2>/dev/null | head -1 || true)"
if [[ -z "$TUNNEL_JSON" ]]; then
  echo "Could not find tunnel credentials in $CRED_DIR"
  exit 1
fi

TUNNEL_UUID="$(basename "$TUNNEL_JSON" .json)"
echo "Using tunnel UUID: $TUNNEL_UUID"

echo ""
echo "Step 3/4 — Write $CONFIG"
mkdir -p "$ROOT/cloudflared"
cat > "$CONFIG" <<EOF
tunnel: $TUNNEL_UUID
credentials-file: $TUNNEL_JSON

ingress:
  - hostname: $HOSTNAME
    service: http://localhost:3000
  - service: http_status:404
EOF

echo ""
echo "Step 4/4 — DNS"
echo "If richolaniyan.com uses Cloudflare DNS, run:"
echo "  cloudflared tunnel route dns receiptbrain $HOSTNAME"
echo ""
echo "If DNS is on Route 53, add this record in the hosted zone for richolaniyan.com:"
echo "  Type:  CNAME"
echo "  Name:  receiptbrain"
echo "  Value: $TUNNEL_UUID.cfargotunnel.com"
echo ""
read -r -p "Route DNS via Cloudflare now? [y/N] " route_dns
if [[ "${route_dns:-}" =~ ^[Yy]$ ]]; then
  cloudflared tunnel route dns receiptbrain "$HOSTNAME" || true
fi

echo ""
echo "Update .env:"
echo "  NEXTAUTH_URL=https://$HOSTNAME"
echo ""
echo "Start stack + tunnel:"
echo "  docker compose up -d && pnpm dev"
echo "  pnpm run tunnel"
echo ""
echo "See docs/cloudflare-tunnel.md for Resend / Google OAuth redirect URIs."
