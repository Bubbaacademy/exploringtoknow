# CURRENT_PRODUCTION_STATUS.md

_Updated: 2026-07-15 — facts below verified live over SSH this session. Regenerate anytime with `infra/server/verify-app.sh`._

**Production HEAD: `68575b2` (`68575b290734e91e2fa333e2a41dbcb8dc8f4c6b`) (Phase 2B/3A — Internal BubbaAffiliate Intake
Management — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:7cc8045a…`) healthy; payload_migrations 26 (before=26 → after=26, no new migration).**
Phase 2B/3A adds an **internal BubbaAffiliate intake command center** at `/app/bubbaaffiliate`, inside the authenticated `/app`
workspace console (NOT a public surface). **Live internal routes** — `/app/bubbaaffiliate` (command center),
`/app/bubbaaffiliate/seller-submissions` (list) + `/app/bubbaaffiliate/seller-submissions/[id]` (detail),
`/app/bubbaaffiliate/creator-applications` (list) + `/app/bubbaaffiliate/creator-applications/[id]` (detail). **All are
auth-gated: unauthenticated access correctly `307 → https://exploringtoknow.com/login`** (verified — not 404/500), and the
pages render once signed in. **Reads existing submissions from the `contact-messages` collection only** — seller submissions
filtered by `source=bubbaaffiliate-seller`, creator applications by `source=bubbaaffiliate-creator` (the very records the Phase
1B/2A public intake already writes), via the safe Local-API pattern. Status handling uses the existing `status` field only;
notes deferred. **Purely additive — NO new schema, NO migrations, NO new collections, NO package/lockfile changes, NO change to
ContactMessages schema or intake logic:** 9 new files under `apps/web/src/app/app/bubbaaffiliate/**` +
`apps/web/src/lib/bubbaaffiliate-intake.ts`, plus one nav line in `apps/web/src/app/app/layout.tsx` (11 files, +608/−7). Merged
to `main` via PR #4 (`0431b43` under merge `68575b2`). Delivered to the VPS by git bundle over SSH (SHA256-verified; `git
bundle verify` passed), working tree fast-forwarded `745d8a6 → 68575b2`, deployed with the standard
`infra/server/deploy-app.sh`. **Verified live:** **build passed** (rebuilt `etk-web`; deploy script's stale-image guard passed
— running image == freshly built `7cc8045a`); migrate ran as an observable **no-op** (`migrations up to date`, 26 → 26); **only
`etk-app` was force-recreated** (`--no-deps`) and came back **healthy**; **worker/Postgres/Caddy were NOT restarted** (unchanged
`StartedAt 2026-07-14T00:22:20Z`) and **no Caddy config was changed**; **health check passed** — `GET
https://exploringtoknow.com/api/health` → HTTP 200 `{"status":"ok","service":"web","missingEnv":[]}`. **DB/env/providers/
credentials/OAuth/tokens/connection-records/Google Ads/Meta Ads all untouched** (no schema/migration change, migrations still
26; no secrets read or printed). Pre-deploy: isolated VPS/Linux **build-only** validation of `0431b43` passed (throwaway image
`etk-web:phase2b3a-validate`, isolated `git archive` extraction, typecheck + lint + `next build` green, cleaned up; live
app/DB untouched). Internal-only; no new public or `noindex` surface introduced.
**Prior — `745d8a6` (Phase 1C — clean host-aware bubbaaffiliate.com domain routing — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:e3861b22…`) healthy; payload_migrations 26 (before=26 → after=26, no new migration).**
**`bubbaaffiliate.com` and `www.bubbaaffiliate.com` now serve the BubbaAffiliate gateway.** App middleware
(`apps/web/src/middleware.ts`) does a **host-aware internal rewrite** on the apex — `/`→`/bubbaaffiliate`,
`/sellers`→`/bubbaaffiliate/sellers`, `/creators`→`/bubbaaffiliate/creators`, `/pricing`→`/bubbaaffiliate/pricing`,
`/how-it-works`→`/bubbaaffiliate/how-it-works` — so the **browser URL stays clean** (`NextResponse.rewrite`, verified
**HTTP 200 with 0 redirects** on all five). Gateway layout + pages emit **host-aware links** (clean on the apex,
`/bubbaaffiliate/*` elsewhere) via `apps/web/src/lib/gateway.ts`. Assets (`/_next/*`), `/api/*`, and the existing
`/bubbaaffiliate/*` routes pass through untouched. **Caddy** (`infra/Caddyfile`, mirrored to the live
`/opt/exploringtoknow/caddy/Caddyfile`) adds a `bubbaaffiliate.com` block (reverse-proxy to the same app container, no
path rewriting — middleware owns clean URLs) and a `www.bubbaaffiliate.com` block that **301-redirects to the apex**
(verified `301 → https://bubbaaffiliate.com/`); TLS auto-issued by Caddy for both names. **Coordinated deploy:** app first
via the standard `infra/server/deploy-app.sh` (fresh image `e3861b22`, migrate no-op 26→26, only `etk-app`
force-recreated → healthy), then the live Caddyfile was **backed up** (`caddy/Caddyfile.bak-20260714-050927`), replaced
from the reviewed repo file, **`caddy validate` → Valid configuration**, and **gracefully reloaded** (no container
restart; Postgres/worker/Caddy not restarted). **Verified live:** `exploringtoknow.com/api/health` 200,
`exploringtoknow.com/` 200, `exploringtoknow.com/bubbaaffiliate` **still 200 (unchanged)**; `bubbaaffiliate.com/`,
`/sellers`, `/creators`, `/pricing`, `/how-it-works` all 200 clean; `www` 301→apex; `POST
bubbaaffiliate.com/api/bubbaaffiliate/intake` reachable (400 on empty body = wired + validating). **No** schema,
migration, route-logic, ContactMessages/intake, package/lockfile, provider, OAuth, env, token, credential, Google Ads,
Meta Ads, connection-record, or sync-state changes. Merged to `main` via PR #3 (`19f3d32`/`91674be` under merge
`745d8a6`); delivered to the VPS by signed git bundle over SSH. Gateway pages remain `noindex` until go-live on the apex.
Pre-deploy: local VPS/Linux build-only validation passed (temp image `etk-web:phase1c-validate` + isolated `caddy
validate`; the first build correctly **caught a type error** — `noUncheckedIndexedAccess` on `.split(':')[0]` — fixed in
`19f3d32` and re-validated green; live app/DB untouched).
**Prior — `432c502` (Phase 1B / 2A — BubbaAffiliate public gateway + seller/creator intake — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:896d492d…`) healthy; payload_migrations 26 (before=26 → after=26, no new migration).**
Adds the public **BubbaAffiliate gateway** as a separate top-level `/bubbaaffiliate` segment (its own layout + brand
chrome, distinct from the ExploringToKnow media layer). **Live routes:** `/bubbaaffiliate` (landing), `/bubbaaffiliate/sellers`,
`/bubbaaffiliate/creators`, `/bubbaaffiliate/pricing`, `/bubbaaffiliate/how-it-works`, and `POST /api/bubbaaffiliate/intake`.
CTAs: **Submit Your Offer** and **Become a Creator Partner**. Pricing page shows the approved early model (onboarding
$99/$299/$499; operation $99/$299/$599 mo) and performance splits (Products 70/30, Services 60/40). **Intake stores
submissions in the existing `contact-messages` collection via the safe Local-API pattern (overrideAccess, honeypot) —
`source=bubbaaffiliate-seller` / `bubbaaffiliate-creator`, `reason=partnership`, structured details composed into `message`.
NO new schema, NO migrations, NO CreatorProfile tables, NO social OAuth, NO dashboards, NO tracking/ledger/payout.** Gateway
pages are `noindex` until `bubbaaffiliate.com` DNS is live. **Purely additive** — 10 new files (`apps/web/src/app/bubbaaffiliate/**`,
`apps/web/src/app/api/bubbaaffiliate/**`, `apps/web/src/components/bubbaaffiliate/**`); existing routes, `/app`, and `/platform`
untouched. Merged to `main` via PR #2 (commit `719fbad` under merge `432c502`). Delivered to the VPS by signed git bundle over
SSH, working tree fast-forwarded to `432c502`, deployed with the standard `infra/server/deploy-app.sh`. **Verified live:**
build + typecheck + lint passed (44/44 static pages generated in the production image); migrate ran as an observable no-op
(26 → 26); only `etk-app` force-recreated onto freshly built image `896d492` (running image == built image); worker/Postgres/
Caddy untouched (not restarted); public health `GET /api/health` → HTTP 200; `GET /bubbaaffiliate` → 200, `GET
/bubbaaffiliate/pricing` → 200, `POST /api/bubbaaffiliate/intake` → 400 on empty body (wired + validating, not 404/500).
Pre-deploy: local VPS/Linux build-only validation of `719fbad` passed (throwaway image `etk-web:phase1b-validate`, isolated
`/tmp` build, cleaned up; live app/DB untouched).
**Prior — `2daa0f2` (Phase 1A — BubbaAffiliate strategic repositioning — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:ac11d504…`) healthy; payload_migrations 26 (before=26 → after=26, no new migration).**
Phase 1A repositions the `/app` workspace console away from public-SaaS language toward the **BubbaAffiliate managed
affiliate operating model** ("Do not sell the software. Use the software to sell the outcome."). **Copy/nav/label/text
ONLY** — 27 files under `apps/web/src/app/app/**` + `apps/web/src/components/app/**`, plus the Master Blueprint added at
`docs/BubbaAffiliate_ETK_Master_Blueprint_2026-07-07.md` (28 files, +1017/-101). Nav reframed: **Command Center**
(dashboard), **Offers** (was Products), **Seller Intake Pipeline** (was Product Requests), **Creator Campaign Asset
Factory** (was Social Studio), **Offer Pages** (was Landing Pages), **Attribution & Reports** (was Performance),
**Invoices & Payouts** (was Billing), **Editorial Console** framed as the ExploringToKnow publishing layer. **No** schema,
migration, route, package/lockfile, provider, OAuth, env, token, credential, Google Ads, Meta Ads, connection-record, or
sync-state changes. Merged to `main` via PR #1 (commit `a47b182` under merge `2daa0f2`). Delivered to the VPS by signed git
bundle over SSH (no GitHub remote on the VPS), working tree fast-forwarded to `2daa0f2`, then deployed with the standard
`infra/server/deploy-app.sh`. **Verified live:** build + typecheck + lint passed in the production Docker image; migrate ran
as an observable no-op step (26 → 26); only `etk-app` force-recreated onto the freshly built image `ac11d504` (running image
== built image, no stale image); worker/Postgres/Caddy untouched (not restarted); public health `GET /api/health` → HTTP 200
`{"status":"ok","service":"web","missingEnv":[]}`. Pre-deploy: local VPS/Linux build-only validation of `a47b182` passed
(throwaway image `etk-web:phase1a-validate`, isolated `/tmp` build, cleaned up; live app/DB untouched).
**Prior — `ace3cea` (Phase 33 Unified Performance + blocked-vs-empty-state fix — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:67dd3c1f…`) healthy; payload_migrations 26 (no new migration).** The provider card now
distinguishes a **failed/blocked** sync from an **honest 0-row** result: `syncBlocked = latest run failed OR sanitized
last_error present`. Google (ws22, `sync_failed` / `DEVELOPER_TOKEN_NOT_APPROVED`) shows a **"sync blocked by provider/API
access approval — Basic Access pending"** message; Meta (ws22, succeeded 0-row) shows the honest no-activity empty state.
A QA manual seed (3 rows, tenant 22, `import_batch_id=qa-seed-20260701`) validates the manual layer (still present; cleanup
in QA §44). Sanitized only; no provider/credential/connection changes.
**Prior — `9529a6d` (Phase 33 base) img `sha256:3b29f25f…`; migrations 26 (no new migration).** `/app/performance` is now
provider-agnostic: a **source filter** (All / Manual / Google Ads / Meta Ads), per-provider **API-synced sections** with
source badges (`api_synced` + `google_ads`/`meta_ads`) driven by the shared `synced_performance_daily` schema, and a
**sanitized per-provider status** card (connection, selected account, last sync, latest run result, last error — no tokens).
**Honest empty state**: a connected provider with 0 rows (no ad activity/spend in the window) is explained as a non-error,
and rows surface automatically once the account has activity. Manual import kept as the labeled `manual_import` fallback.
Verified live: routes+filters 307 (no 500s); meta_ads (ws22) connected+0-rows→empty state; google_ads (ws22) connected+0-rows
+sanitized error; no-data (ws1) shows connect hints; tenant isolation (no NULL-workspace rows; workspace-scoped reads).
**Prior — `e51a7a2`: provider-aware CTA labels fix + Meta Ads LIVE-CONNECTED & read-sync validated (img `1df63148`).** **Meta env activated** (platform
`META_APP_ID/SECRET/REDIRECT_URI/API_VERSION` set in prod env, deduped to one each; page shows "Ready"). A `workspace_owner`
(tenant 22) connected their OWN Meta account → **encrypted per-workspace token** (no refresh token — Meta long-lived ~60d),
scope `ads_read` → **`me/adaccounts` discovery returned 9 ad accounts** → account `1572024181155200` (Pouyan Pazargadi, USD)
selected → **"Sync last 30 days" ran and SUCCEEDED** (run 6, read=0/written=0: the account had no ad activity in the window,
so 0 honest `api_synced` rows — pipeline proven, no fabricated data). Fixed a UI cross-label bug (Meta page previously
showed "Connect Google Ads"); CTA labels are now provider-aware. **Read-only `ads_read` throughout.** Earlier (`d8bc378`):
public legal pages + brand assets. (Phase 32 foundation: `709e3fc`, img `dba3e20f`.)
**Prior baseline marker — `d8bc378` (legal pages + brand assets); payload_migrations 26 (no new migration).** **Public assets for Meta app setup (all HTTP 200):** `/privacy`, `/terms`, `/data-deletion` (doc-page style,
contact `info@exploringtoknow.com`, footer "Legal" links); **brand:** 12-petal Persian-lotus mark (deep green + warm gold)
at `apps/web/public/brand/` (incl. `icon-1024.png` = Meta app icon, `logo-wordmark.svg/.png`) + site favicons
(`apps/web/src/app/icon.png`, `apple-icon.png`). No Meta App Review/publish started.

**Prior — Phase 32 (HEAD `709e3fc`, img `dba3e20f…`):** Meta Ads provider connection + read-sync FOUNDATION — DEPLOYED,
env-gated / "platform setup pending"; Phase 31/31A Google Ads remains LIVE-VALIDATED, blocked only on a Google-side
developer-token Basic Access approval, SUBMITTED/pending.
**payload_migrations 26 (the Phase 30/31 schema already enumerates `meta_ads`).** **Phase 32 Meta:** mirrors the Google architecture, READ-ONLY (`ads_read` only); platform
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
Production (VPS `/opt/exploringtoknow`, branch `main`) app code is at `68575b2` (Phase 2B/3A internal-intake merge, PR #4;
built & deployed; no migration, 26 → 26). Live Caddy config unchanged this deploy (still serves `bubbaaffiliate.com` + `www`;
backup retained at `/opt/exploringtoknow/caddy/Caddyfile.bak-20260714-050927`). GitHub origin `Bubbaacademy/exploringtoknow`
holds `main` @ `68575b2`; the VPS has no GitHub remote (updated via git bundle over SSH). Rollback points: before Phase 2B/3A
`745d8a6` (prior production HEAD; Phase 1C — app-only rollback, redeploy that commit with `deploy-app.sh`); before Phase 1C
`432c502` (Phase 1B/2A) — for a Caddy-only rollback, restore the `.bak-*` file and `caddy reload`; before Phase
1B/2A `2daa0f2` (Phase 1A); before Phase 1A `ace3cea`; before blocked-state fix `eb8e91b`; before Phase 33 `c7da882`; before
legal/brand `8fccef5`; before Phase 32 `2993976`. Worker fix baseline `c158c5f` unchanged. (Prod has ETK + 1 retained test
workspace + 1 customer workspace "testing" [tenant 22, which holds the live Google Ads connection]; ETK content unchanged.)
