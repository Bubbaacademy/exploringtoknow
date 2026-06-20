# CURRENT_PRODUCTION_STATUS.md

_Updated: 2026-06-18 — SSH access to the VPS restored (key authorized for `deploy`); facts below verified live
over SSH this session. Regenerate anytime with `infra/server/verify-app.sh`._

**Production HEAD: `4997a44` (Blueprint v2 Phase 27 — Ads Studio v1: manual campaign + creative drafts).**
App image `etk-web` (id `sha256:2dbea910…`) healthy; **payload_migrations 23** (phase27: `ad_campaigns` + `ad_creatives`
tables, additive). New **Ads Studio** at `/app/ads` — owner/admin/editor **manually** plan ad **campaign drafts** +
**creative drafts** (headline/primary text/description/CTA), with a live **UTM tracking-URL builder**, related
product/request/landing-page/social-post/Brand-Kit pickers, and copy/CSV **export** for manual Ads-Manager setup.
**Manual + pre-API ONLY** — no ad accounts, no OAuth, no ad API, no campaign launch, no budget spend (budget/schedule
are planning notes), no AI/image/video, no external calls. Social Studio `/app/social-posts` (Phase 25/26), landing
pages `/app/landing-pages` (Phase 23/24), Brand Kit `/app/brand` (Phase 22), and the legacy `social-posts` AI/worker
pipeline all unchanged. No binary upload yet. Email + billing still local-safe.
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
Production (VPS `/opt/exploringtoknow`, branch `main`) and local are in sync at `4997a44` (Phase 27 feat + build
fixes); the docs commit on top is docs-only. Worker fix baseline `c158c5f` unchanged. (Prod also has 1 retained
test workspace + 1 organic customer workspace alongside ETK — 3 tenants total; ETK content unchanged.)
