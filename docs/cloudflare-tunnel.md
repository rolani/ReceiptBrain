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

## Path A — Dashboard tunnel + Route 53 (no nameserver change)

Use this if you created the tunnel in the **Cloudflare dashboard** and DNS stays on **Route 53**.

### 1. Add a **Published application route** (not Hostname route)

Cloudflare’s tunnel UI has several route types:

| Tab | Purpose | For ReceiptBrain? |
|-----|---------|-------------------|
| **Published application routes** | Public URL → `localhost:3000` | **Yes — use this** |
| **Hostname routes** | Steer hostname traffic to tunnel (no origin URL) | No |
| **CIDR routes** | Private IP ranges | No |

**Option A — From your tunnel page**

1. Open [Zero Trust → Networks → Connectors → Cloudflare Tunnels](https://one.dash.cloudflare.com/)
2. Click your tunnel (`1e59415e-67af-47a0-91ae-366bbb98f338`)
3. Open **Published application routes** (not Hostname routes)
4. Click **Add a published application route** (or **Add route** → **Published application**)
5. Set:

   | Field | Value |
   |-------|--------|
   | **Hostname** | `receiptbrain` + `richolaniyan.com`, **or** full `receiptbrain.richolaniyan.com` |
   | **Service type** | HTTP |
   | **URL** | `localhost:3000` |

6. **Save**

**Option B — New unified UI**

1. [Networking → Tunnels](https://dash.cloudflare.com/) → your tunnel
2. Under **Routes** → **Add route**
3. Choose **Published application**
4. Hostname: `receiptbrain.richolaniyan.com`
5. Service URL: `http://localhost:3000`
6. **Add route**

If `richolaniyan.com` is **not** in the domain dropdown (Route 53 only), type the **full hostname** `receiptbrain.richolaniyan.com` or use the API step below.

You can **ignore or delete** the Hostname route you created — it does not point traffic to `localhost:3000`.

Copy your **Tunnel ID** from the same page (UUID like `a1b2c3d4-...`). You need it for Route 53.

### 2. Add DNS in Route 53

In the hosted zone for `richolaniyan.com`:

| Type | Name | Value |
|------|------|-------|
| **CNAME** | `receiptbrain` | `<TUNNEL-ID>.cfargotunnel.com` |

Example: tunnel ID `f70ff985-a4ef-4643-bbbc-4a0ed4fc8415` →  
`f70ff985-a4ef-4643-bbbc-4a0ed4fc8415.cfargotunnel.com`

Delete any **AAAA** record for `receiptbrain` if present.

### 3. Run the tunnel connector on your Mac

On the tunnel page, under **Install connector**, copy the token from:

```bash
cloudflared tunnel run --token eyJhIjoi...
```

In a terminal:

```bash
export CLOUDFLARE_TUNNEL_TOKEN='paste-token-here'
pnpm run tunnel:token
```

Leave this running. You do **not** need `cert.pem` or `cloudflared/config.yml` for dashboard-managed tunnels.

### 4. Run ReceiptBrain + verify

Terminal 1:

```bash
docker compose up -d
pnpm dev
```

Terminal 2:

```bash
pnpm run tunnel:token   # with CLOUDFLARE_TUNNEL_TOKEN set
```

Update `.env`:

```env
NEXTAUTH_URL=https://receiptbrain.richolaniyan.com
```

Restart `pnpm dev` after editing `.env`.

Test (after DNS propagates, usually a few minutes):

```bash
curl -s https://receiptbrain.richolaniyan.com/api/health
```

In the Cloudflare dashboard, the tunnel status should show **Healthy** with active connections.

## Quick setup (CLI / local config)

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
