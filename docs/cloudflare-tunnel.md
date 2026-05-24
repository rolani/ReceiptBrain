# Expose local ReceiptBrain via Cloudflare Tunnel

Run the full stack on your Mac and publish **only** the Next.js web app (`localhost:3000`) at  
`https://receiptbrain.richolaniyan.com`.

Postgres, Redis, MinIO, the AI service, and the worker stay on your machine — they are **not** tunneled.

## Prerequisites

- ReceiptBrain running locally (`docker compose up -d`, `pnpm dev`)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- DNS control for `richolaniyan.com` (Route 53 or Cloudflare)

Install the tunnel client:

```bash
brew install cloudflared
```

## Quick setup (automated)

From the repo root:

```bash
chmod +x scripts/setup-cloudflare-tunnel.sh scripts/run-cloudflare-tunnel.sh
./scripts/setup-cloudflare-tunnel.sh
```

Then update `.env`:

```env
NEXTAUTH_URL=https://receiptbrain.richolaniyan.com
```

Restart `pnpm dev` after changing `.env`.

## Manual setup

### 1. Authenticate and create a tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create receiptbrain
```

Note the tunnel UUID and credentials file path under `~/.cloudflared/<uuid>.json`.

### 2. Configure ingress

```bash
cp cloudflared/config.example.yml cloudflared/config.yml
```

Edit `cloudflared/config.yml` with your tunnel UUID and credentials path.

### 3. DNS

**Option A — Domain on Cloudflare DNS**

```bash
cloudflared tunnel route dns receiptbrain receiptbrain.richolaniyan.com
```

**Option B — Domain on Route 53**

In the hosted zone for `richolaniyan.com`, create:

| Type  | Name           | Value                              |
|-------|----------------|------------------------------------|
| CNAME | `receiptbrain` | `<TUNNEL-UUID>.cfargotunnel.com`   |

Remove any **AAAA** record for `receiptbrain` (Render/Cloudflare guidance: IPv6 can break TLS routing).

Propagation usually takes a few minutes.

### 4. Start the tunnel

Terminal 1 — stack:

```bash
docker compose up -d
pnpm --filter @receiptbrain/lib db:migrate
pnpm dev
```

Terminal 2 — tunnel:

```bash
pnpm run tunnel
# or: ./scripts/run-cloudflare-tunnel.sh
```

### 5. Verify

```bash
curl -s https://receiptbrain.richolaniyan.com/api/health | jq
```

Expect `"ok": true` with `db`, `redis`, and `ai` checks passing.

## Auth & email checklist

After the tunnel is live, update third-party URLs to match `NEXTAUTH_URL`:

| Service        | Setting |
|----------------|---------|
| **Resend**     | Verified sending domain for `AUTH_EMAIL_FROM` |
| **Google OAuth** (optional) | Redirect URI: `https://receiptbrain.richolaniyan.com/api/auth/callback/google` |

Magic links embed `NEXTAUTH_URL`. If it still points at `http://localhost:3000`, sign-in will fail from the public URL.

## Keep running after closing the terminal (optional)

Install [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start pm2.ecosystem.config.cjs
pm2 save
pm2 startup   # follow printed instructions for boot persistence
```

Docker Compose services should also restart on reboot if Docker Desktop is set to start at login.

## Security notes

- Only port **3000** is exposed. Never tunnel Postgres (5432), Redis (6379), or MinIO (9000).
- `cloudflared/config.yml` and `~/.cloudflared/*.json` contain secrets — both are gitignored.
- The app is only available while your Mac is awake and the stack + tunnel are running.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 502 / connection refused | Ensure `pnpm dev` is running and listening on `:3000` |
| Magic link goes to localhost | Set `NEXTAUTH_URL` to the public HTTPS URL and restart web |
| TLS / certificate pending | Wait for DNS; confirm CNAME points to `*.cfargotunnel.com` |
| Health `ai: false` | `docker compose up -d ai` and check `AI_SERVICE_URL=http://localhost:8000` in `.env` |
| Upload works, no extraction | Worker must be running (`pnpm dev` includes worker via turbo) |

## References

- [Cloudflare Tunnel docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Configure DNS with other providers](https://render.com/docs/configure-other-dns) (CNAME pattern applies to Cloudflare tunnels too)
