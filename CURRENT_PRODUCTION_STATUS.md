# CURRENT_PRODUCTION_STATUS.md

_Updated: 2026-06-18 — SSH access to the VPS restored (key authorized for `deploy`); facts below verified live
over SSH this session. Regenerate anytime with `infra/server/verify-app.sh`._

**Production HEAD: `622fc59` (Blueprint v2 Phase 26 — Social calendar + bulk export + duplication).**
App image `etk-web` (id `sha256:2d13fb8b…`) healthy; **payload_migrations 22** (phase26: planning columns on
`social_studio_posts`, additive). **Social Studio** at `/app/social-posts` now adds **planning** (planned date,
campaign, pillar, priority, assignee, notes), a **Board** view (by status) + **Calendar** view (by planned date), a
Social overview strip, **bulk copy/CSV export** of approved posts, **channel duplication** (creates drafts), and
**content-set-from-landing** (blank drafts from a landing page with public URL prefilled). **Still manual + pre-API** —
no OAuth, no social account connection, no publishing, no scheduling execution, no AI/image/video, no external calls.
Built on the Phase 25 Social Studio foundation (manual authoring + clipboard export); legacy `social-posts` AI/worker
pipeline still untouched. Landing pages `/app/landing-pages` (Phase 23/24) + Brand Kit `/app/brand` (Phase 22)
unchanged. No binary upload yet. Email + billing still local-safe.
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
Production (VPS `/opt/exploringtoknow`, branch `main`) and local are in sync at `622fc59` (Phase 26 feat);
the docs commit on top is docs-only. Worker fix baseline `c158c5f` unchanged.
