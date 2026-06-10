# ExploringToKnow — Infrastructure Runbook (Phase A/B)

Production-grade prep for a single Ubuntu 24.04 VPS (Vultr). **No app code is
deployed in this phase.** Architecture is unchanged: Next.js + Payload + Postgres
+ Docker + LangGraph. No WordPress, no Sheets, no SaaS shortcuts.

## Reverse proxy strategy
**Caddy** is the edge reverse proxy (chosen for automatic Let's Encrypt TLS, HTTP→HTTPS
redirect, and a tiny config). It terminates TLS for `exploringtoknow.com` and
`www.` and proxies to the `app` container on :3000 (added in the app-deploy phase).
Postgres is **not** exposed to the host/internet — only the app reaches it over the
compose network. Alternative if you prefer: Nginx + certbot (same ports; more config).

## One-command deploy (from your workstation)
Provisions everything (Docker → hardening → structure → Postgres + Caddy), runs the
verifier, and pulls `DEPLOYMENT_VERIFICATION_REPORT.md` back locally. Does NOT deploy the app.

```bash
VPS="root@YOUR_VPS_IP" DOMAIN=exploringtoknow.com bash infra/deploy.sh
# optional: SSH_KEY=~/.ssh/id_ed25519  DEPLOY_USER=deploy
```
Keep an SSH session open during the hardening step.

## Order of operations (manual)
Run the audit first, then provision. Keep an SSH session open during hardening.

```bash
# 0) AUDIT (from your workstation)
DOMAIN=exploringtoknow.com VPS="root@YOUR_VPS_IP" bash infra/audit/audit.sh
#    → writes INFRA_READINESS_REPORT.md. Confirm DNS A record → VPS IP before TLS.

# 1) Copy infra to the server
scp -r infra root@YOUR_VPS_IP:/root/etk-infra

# 2) On the VPS (as root):
DEPLOY_USER=deploy bash /root/etk-infra/server/00-bootstrap-docker.sh   # Docker + Compose
DEPLOY_USER=deploy bash /root/etk-infra/server/10-harden.sh             # ufw, fail2ban, swap, SSH (guarded)
DEPLOY_USER=deploy bash /root/etk-infra/server/20-structure.sh          # /opt/exploringtoknow

# 3) As the deploy user:
bash /opt/exploringtoknow/... # ensure infra files copied, then:
ROOT=/opt/exploringtoknow bash /root/etk-infra/server/30-postgres.sh    # Postgres + Caddy up (NO app)
```

## Security hardening applied (10-harden.sh)
- `ufw`: default-deny inbound; allow 22/80/443 only.
- `fail2ban`: sshd jail (5 retries → 1h ban).
- `unattended-upgrades`: automatic security patches.
- 2 GB swap if none.
- **Guarded** SSH hardening: disables root + password login **only** after a
  key-based login exists for the deploy user (won't lock you out). Test a new
  session before closing the current one.

## Directory structure (/opt/exploringtoknow)
```
compose/   docker-compose.yml        # postgres + caddy (+ app, profiled off)
caddy/     Caddyfile                 # reverse proxy + TLS
env/       .env (600, secrets)       # generated on first run
postgres-data/                       # DB volume (bind mount)
backups/   logs/
```

## What this phase intentionally does NOT do
- No application image build/deploy (the `app` service is behind the `app` profile).
- No DNS changes (you point the A records at the VPS).
- No architecture changes.

## Exact next recommended step
1. Create DNS **A** records: `exploringtoknow.com` and `www` → your VPS IP (Vultr DNS).
2. Run the audit; confirm `DNS A points at this VPS`.
3. Run scripts 00 → 10 → 20 → 30. You'll have Docker, a hardened firewall, the prod
   directory tree, and a running **Postgres + Caddy** (Caddy will 502 until the app
   is deployed — expected).
4. Stop and request review before the **app-deploy phase** (Dockerfile for `apps/web`,
   build, `--profile app up`, migrations).

---

## App phase (after infra is up) — prepared, pending first build on the VPS
The app is containerized and gated behind the compose `app` profile. Images are
built ON the VPS (no registry needed).

**Prerequisite (one-time, do before first app deploy):** generate & commit Payload
DB migrations so production applies migrations instead of dev "push":
```bash
# locally, with a dev DB reachable:
pnpm --filter @etk/web exec payload generate:migrations
git add apps/web/src/migrations && git commit -m "Add Payload migrations"
```

**Deploy the app + worker:**
```bash
# on the VPS, after 00–30 and after putting ANTHROPIC_API_KEY into env/.env
ROOT=/opt/exploringtoknow bash /root/etk-infra/server/40-app.sh
```
`40-app.sh` builds the web + worker images, runs the `migrate` one-shot
(ops SQL migrations + `payload migrate`), starts `app` and `worker`, and waits
for the app healthcheck. Caddy then serves `https://exploringtoknow.com`.

> NOTE: the Dockerfiles (`apps/web/Dockerfile`, `apps/worker/Dockerfile`) are
> production-shaped (Next standalone; pnpm workspace prune) but have NOT yet been
> `docker build`-validated in this environment (no Docker available here). The
> first `40-app.sh` build run on the VPS is the validation step; iterate from its log.
