# CURRENT_PRODUCTION_STATUS.md

_Updated: 2026-06-18 — SSH access to the VPS restored (key authorized for `deploy`); facts below verified live
over SSH this session. Regenerate anytime with `infra/server/verify-app.sh`._

**Production HEAD: `dfa94f5` (Blueprint v2 Phase 21 — Billing/Plans/Usage real activation, Stripe-ready, local-safe).**
App image `etk-web@sha256:6536c7ee…` healthy; payload_migrations 17 (no migration this phase).
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
