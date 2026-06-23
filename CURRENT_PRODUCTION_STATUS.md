# CURRENT_PRODUCTION_STATUS.md

_Updated: 2026-06-23 — facts below verified live over SSH this session. Regenerate anytime with `infra/server/verify-app.sh`._

**Production HEAD: `709e3fc` (Phase 32 Meta Ads provider connection + read-sync FOUNDATION — DEPLOYED, env-gated /
"platform setup pending"; Phase 31/31A Google Ads remains LIVE-VALIDATED, blocked only on a Google-side developer-token
Basic Access approval, SUBMITTED/pending).**
App image `etk-web` (id `sha256:dba3e20f…`) healthy; **payload_migrations 26 (NO new migration — the Phase 30/31 schema
already enumerates `meta_ads`).** **Phase 32 Meta:** mirrors the Google architecture, READ-ONLY (`ads_read` only); platform
owns ONE Meta app (env only), each workspace owner connects their OWN Meta ad account via OAuth (per-workspace AES-256-GCM
tokens; Meta long-lived ~60-day token via `fb_exchange_token`, no refresh token; Graph API default `v25.0`). **No `META_*`
set in prod → Meta shows "setup pending": no OAuth, no sync, no external call (0 meta_ads connection rows).** Operator next
step: create the Meta app + credentials (`META_OPERATOR_SETUP.md`). Google Ads (Phase 31) prior state below is unchanged.

**Production HEAD baseline: `42ef955` (Phase 31 Google Ads Read Sync — LIVE-ACTIVATED & VALIDATED END-TO-END; blocked only
on a Google-side developer-token Basic Access approval, SUBMITTED/pending).**
App image `etk-web` (id `sha256:b8912f73…`) healthy; **payload_migrations 26** (`provider_accounts` +
`synced_performance_daily`, additive). Platform Google Ads API credentials are **set in prod env** (operator-owned, never
customer-facing). **Multi-tenant customer OAuth proven live:** a `workspace_owner` (workspace "testing", tenant 22)
connected their OWN Google Ads account → **encrypted per-workspace tokens** stored → **v24 account discovery succeeded**
(customer `2315570544` discovered + selected) → "Sync last 30 days" invoked. The report query returns a clean
`DEVELOPER_TOKEN_NOT_APPROVED` (HTTP 403): the platform developer token is at **Test access** and can't query real
accounts → **0 `api_synced` rows yet**. **Not a code issue** — the whole pipeline works; awaiting Google's **Basic Access**
approval (or connect a **test account** to validate now). API default is **v24** (v20 sunset); errors captured **sanitized**
(no tokens/headers). **READ-ONLY** — no mutate/launch/spend. The connection (id 8, tenant 22, customer `2315570544`) is
left **connected** for the post-approval re-sync. Manual performance (Phase 28) remains the **fallback**. (Multi-tenant
OAuth model + compliance talking points: PROVIDER_API_AUDIT.md §4b/§4c.)
**Connections** area at `/app/provider-connections` (Phase 30 OAuth/token vault) — tokens AES-256-GCM-encrypted, never exposed.
**Strategic direction is API-first** for ad/social/performance measurement (see `PROVIDER_API_AUDIT.md`):
the **Performance** area at `/app/performance` is the **manual fallback / onboarding / formula-validation / CSV layer**,
**not** the long-term source of truth — API-synced provider data (Google Ads first, then Meta/TikTok/LinkedIn/Pinterest)
will be primary, with every number **source-labeled** (internal / api-synced / manual / calculated). Today it remains
owner/admin/editor **manual** entry or **paste-CSV import** of performance data, with **calculated** CTR/CPC/CPM/CVR/CPA/
ROAS (safe zero-denominators → "—", no fabricated numbers), an overview, and internal Phase-24 landing-page views shown
**separately** from manual ad clicks. **Manual-only today** — no OAuth, no ad/social account connection, no external API,
no real-time sync, no fake metrics, no AI/optimization, no launch/spend. Ads Studio
`/app/ads` (Phase 27), Social Studio `/app/social-posts` (Phase 25/26), landing pages `/app/landing-pages` (Phase 23/24),
Brand Kit `/app/brand` (Phase 22) all unchanged. No binary upload yet. Email + billing still local-safe.
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
Production (VPS `/opt/exploringtoknow`, branch `main`) app code is at `709e3fc` (Phase 32 Meta foundation, built & deployed;
no migration); the docs commit on top is docs-only. Local + server in sync. Rollback point before Phase 32: `2993976`. Worker fix baseline `c158c5f` unchanged. (Prod has ETK + 1 retained
test workspace + 1 customer workspace "testing" [tenant 22, which holds the live Google Ads connection]; ETK content unchanged.)
