# CURRENT_PRODUCTION_STATUS.md

_Updated: 2026-06-18 — SSH access to the VPS restored (key authorized for `deploy`); facts below verified live
over SSH this session. Regenerate anytime with `infra/server/verify-app.sh`._

**Production HEAD: `4ea5b66` (Blueprint v2 Phase 22 — Brand Kit / Asset Library foundation).**
App image `etk-web@sha256:11d175ad…` healthy; **payload_migrations 18** (phase22 brand-kit applied: brand_profiles
+ brand_assets, additive). Workspace Brand Kit live at `/app/brand` (owner/admin editable, tenant-scoped); no
binary upload yet (metadata/reference entries only). Prior: Phase 21 billing activation (Stripe-ready, local-safe).
- **Billing layer: local-safe** — no Stripe/billing env → no real charges, checkout/portal return disabled,
  webhook inert. Stripe-ready: activates only with `BILLING_ENABLED=true` + `STRIPE_SECRET_KEY` (+ `STRIPE_PRICE_*`,
  `STRIPE_WEBHOOK_SECRET`); use Stripe **test mode** first. On real checkout the webhook sets the tenant's plan;
  canceled/unpaid subscriptions are enforced as restricted.
- **Email layer: local-safe** (Phase 20) — all provider env keys absent → no external send; provider-ready when
  `NEWSLETTER_PROVIDER`/`RESEND_API_KEY`/… are set.

## Live now — all green
| Component | Status |
|---|---|
| Public site — https://exploringtoknow.com | UP |
| /api/health | `ok` |
| /admin (Payload) | accessible; first admin user created |
| Next.js web container (etk-app) | healthy |
| **Worker (etk-worker)** | **Up, not restarting; scheduler_started + worker_ready** |
| PostgreSQL (etk-postgres) | healthy; private (not publicly exposed) |
| Caddy / HTTPS (etk-caddy) | running; TLS issued for apex + www |

## Architecture (unchanged — Master Blueprint preserved)
Next.js 15 + Payload CMS (source of truth) · PostgreSQL · Worker runtime ·
LangGraph (AI orchestration) · Queue (pg-boss) · Prompt Registry · Provider
abstraction · Docker Compose · Caddy reverse proxy. No WordPress, no Google
Sheets, no SaaS/multi-tenant shortcuts.

## Remaining warnings (non-blocking)
- `punycode` **DeprecationWarning** in worker logs — cosmetic Node notice from a
  transitive dep (whatwg-url); not an error, worker runs normally. Removable later
  by externalizing the AI SDKs (see NEXT_PHASE_PLAN §1).
- No automated DB backups yet.
- No uptime/health alerting yet.
- Secrets currently live in `/opt/exploringtoknow/env/.env` (file-based).
- AI generation runs in **mock mode** until `ANTHROPIC_API_KEY` is set (by design).

## Must NOT be touched (stable — leave alone)
- etk-postgres (data volume `/opt/exploringtoknow/postgres-data`)
- etk-app (web/Payload)
- etk-caddy (TLS certs in `caddy_data`)
- Payload schema / committed migrations
Any future change to these requires its own reviewed, scoped deployment.

## Repo state
Production matches commit `c158c5f` (worker fix); docs at `827637f`+.
