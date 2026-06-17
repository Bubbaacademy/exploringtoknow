# PROJECT_STATE.md

> Current snapshot. Updated 2026-06-16 after **Phase 15 (public signup + workspace onboarding + free trial)** deployment & live verification.

---

## ⭐ ARCHITECTURE PIVOT — ExploringToKnow is now Tenant/Workspace #1 of a SaaS platform

ExploringToKnow is no longer a standalone magazine: it is the **first live tenant/workspace of an
Owned Media AI OS / AI Commerce Media OS**. The live public magazine is **unchanged** — the pivot is
additive foundation underneath it. Phase 13 shipped the data model + access model + operator surfaces.

### Operator layers (two distinct surfaces + the existing two)
| Surface | Who | Purpose | Gate |
|---|---|---|---|
| `/platform` | Platform **super admin** | Cross-tenant overview (all tenants/workspaces/users + per-tenant rollup) | `requireSuperAdmin()` server-side + middleware presence |
| `/app` | Any **workspace member** | Tenant-scoped workspace overview (content/audience/access), all figures scoped to the actor's tenant | `requireWorkspaceMember()` server-side + middleware presence |
| `/dashboard` | **Platform super admin only** (P15) | ETK internal editorial console (shows ETK data unscoped → gated to super admin server-side) | middleware presence + `requireSuperAdmin()` in the layout |
| `/admin` | **Platform super admin only** | Payload native CMS (internal source of truth, NOT the customer UI) | Payload login + `Users.access.admin` (super-admin gate; legacy `role:'admin'` fallback) |
| `/signup` · `/login` | **Public** | Self-serve workspace signup (flag-gated) + sign in | public; `/api/auth/{signup,login,logout}` |

Customers/workspace users belong in **/app**; they are blocked from `/admin` (access.admin), `/platform`
(requireSuperAdmin → redirect to /app), and `/dashboard` (requireSuperAdmin). Auth is Payload's session
cookie (`payload-token`); login/signup set it via `payload.login` + `lib/session.ts`. Unauthenticated
operator routes redirect to **/login**.

### Signup / trial config (env flags; safe defaults)
`PUBLIC_SIGNUP_ENABLED` (default **off** → /signup shows an early-access state; API returns 403) ·
`FREE_TRIAL_DAYS` (default 14) · `DEFAULT_WORKSPACE_PLAN` (default `trial`) · `REQUIRE_EMAIL_VERIFICATION`
(default off → new owner auto-logged-in; no fake "email sent"). No billing, Stripe, custom domains, or real
email sending in this phase.

### Role model (Memberships.role)
`platform_super_admin` · `workspace_owner` · `workspace_admin` · `editor` · `viewer` (analyst).
The actor + role are resolved **server-side** from the Payload session (`payload.auth`) and their
Memberships — **never** from client-submitted tenant/workspace/role values (`apps/web/src/lib/tenant.ts`).

### Data model (additive; all three in admin group "Platform")
- **Tenants** — customer/organization account (slug unique, status, plan placeholder, trial/billing placeholders — **no Stripe**).
- **Workspaces** — publication/site under a tenant (mode: `exploring_network` | `hosted` | `custom_domain_ready`; `primaryDomain` is a **placeholder — no DNS/SSL** activation).
- **Memberships** — (user × tenant × workspace × role); the authority for access decisions. A `platform_super_admin` membership may carry no tenant (platform-wide).
- **Additive `tenant` + `workspace` relationships** on every operational collection (Phase 13 added
  `tenant`; Phase 14 added `workspace` to the original 10 and `tenant`+`workspace` to brands,
  content-briefs, product-intelligence, social-posts). **media** read stays public so published-article
  images render. Collections scoped: products, articles, product-requests, categories, authors,
  newsletter-subscribers, contact-messages, generation-runs, article-views, media, brands, content-briefs,
  product-intelligence, social-posts. Platform-global: tenants, workspaces, memberships, users.

### Access-control model = TRUE server-side (Phase 14)
- **Collection `access` (native REST/admin, overrideAccess=false):** super admin → all; authenticated
  workspace member → a `{ tenant: { in: [...] } }` Where (read) and tenant-scoped update/delete; create
  requires a membership. Anonymous → published-only for articles, public for reference data
  (categories/authors/media/brands), deny for private collections. Implemented in `lib/access.ts`.
- **`/app` + `/platform` (Local API):** queries derive their tenant/workspace filter from the session
  context; the client cannot influence it.
- **Writes:** the `stampTenantWorkspace` hook forces tenant/workspace from the actor's membership (never
  trusts client ids); system/worker creates default to ETK so no record is left unscoped.
- **Public site + worker** use the Local API with `overrideAccess` and are intentionally unaffected; the
  public published-only gate (`lib/public.ts`) and all URLs are **unchanged**.
- Proven by `scripts/verify-tenant-isolation.ts` (temporary second tenant; create → assert → delete).

### SaaS roadmap
- ✅ **Phase 15 — Public signup / onboarding / free trial** (self-serve tenant+workspace creation) — DONE.
- **Phase 16 (recommended next) — Real email-provider activation** (verify Resend env, double-opt-in,
  signup verification + welcome email) OR **Billing / Plans / Usage limits** (Stripe) — pick by whether
  provider credentials are ready. Email activation is lower-risk and unblocks `REQUIRE_EMAIL_VERIFICATION`.
- **Phase 17 — Custom domain / publication hosting** (DNS/SSL on the workspace domain placeholders).
- **Phase 18 — Workspace-level AI generation limits + per-workspace product/content workflows** (so a
  workspace owner can add products + request articles scoped to THEIR workspace, not ETK).
- **Phase 19 — Attribution, affiliate analytics, conversion tracking.**
- **Phase 20 — Ad campaign generation / management.**

---

## Phase 15 — Public signup + workspace onboarding + free trial: COMPLETE & DEPLOYED (migration 14 → 15)
First self-serve SaaS onboarding layer. Foundation only — **no billing, Stripe, custom domains, real email
sending, or AI automation.** The ETK public magazine is unchanged.
- **Signup route + flow:** `/signup` (premium, on the public design system; honeypot, anti-double-submit,
  validation, a11y, mobile). Flag-gated by `PUBLIC_SIGNUP_ENABLED` (default off → tasteful early-access
  state + API 403). `/login` page + `/api/auth/{signup,login,logout}` route handlers using Payload
  `payload.login` and the `payload-token` cookie (`lib/session.ts`). Middleware login redirect → `/login`.
- **Transactional onboarding** (`lib/onboarding.ts`): one transaction creates User + Tenant + Workspace +
  `workspace_owner` Membership + trial metadata. Email normalized; duplicate email → friendly 409; workspace
  slug sanitized + auto-uniqued. All ids derived server-side; **no client-trusted tenant/workspace ids**.
  **No product/article/generation/media/category** is created during signup.
- **Free-trial model:** additive tenant fields `trialStartedAt`, `onboardingStatus`, `onboardingStep`,
  `signupSource` (status already had `trial`, `trialEndsAt` existed). Trial = `FREE_TRIAL_DAYS` (14).
- **/app onboarding:** welcome + business/workspace name + Owner role + trial banner; a 6-step onboarding
  checklist for empty workspaces (informational — never triggers generation); role-aware quick links.
- **/platform signup visibility:** signup-enabled flag, free-trial days, recent signups (business/workspace/
  owner email/plan/status/trial-ends/source), and an onboarding-errors panel (tenants missing a workspace/owner).
- **Security fix bundled:** `/dashboard` (ETK editorial console, shows ETK data unscoped) is now
  `requireSuperAdmin()`-gated so newly-loggable workspace owners can't reach ETK's console.
- **Email:** local-safe. `REQUIRE_EMAIL_VERIFICATION` default off (new owner auto-logged-in). When on,
  signup returns a clear "check your email" state — never a fake "email sent". No provider creds touched.
- **Verified:** `scripts/verify-signup-onboarding.ts` (run on prod via the migrate image, create→assert→delete)
  proved a signup yields exactly 1 tenant/1 workspace/1 owner membership with trial status, full isolation from
  ETK (and ETK super sees both), and **zero content/generation/media side effects**. Plus live route + data checks.

### Phase 15 migration
`20260616_090000_phase15_signup_onboarding` — additive/idempotent: `tenants.trial_started_at`,
`onboarding_status` (enum), `onboarding_step`, `signup_source` (+index). Pre-validated in a rolled-back tx.
Payload migrations **14 → 15**.

### Phase 15 DB backup
`/opt/exploringtoknow/backups/pre-phase15_<ts>.sql.gz` (verified before migration).

## Phase 14 — Tenant isolation hardening + workspace scoping: COMPLETE & DEPLOYED (migration 13 → 14)
Made the multi-tenant foundation safe to build on. Additive only; the public magazine is unchanged.
See the **ARCHITECTURE PIVOT** block for the full access-control + role + route model.
- **Workspace scoping completed:** added additive `workspace` to the 10 Phase-13 collections and
  `tenant`+`workspace` to brands, content-briefs, product-intelligence, social-posts. Every operational
  collection now carries both. Backfilled all rows to ExploringToKnow + ETK Magazine.
- **TRUE server-side access control** (`lib/access.ts`): super admin → all; workspace member → only their
  tenant (read = tenant `Where`, scoped update/delete, create requires membership); anonymous → published-only
  for articles, public for reference data, hard-deny for private. Applied to all scoped collections and to
  tenants/workspaces/memberships/users reads. Public site + worker (Local API overrideAccess) unaffected.
- **`/admin` is now platform-super-admin-only** (`Users.access.admin`; legacy `role:'admin'` fallback to
  avoid operator lockout). Workspace customers belong in `/app`.
- **No client-trusted tenant ids:** `stampTenantWorkspace` beforeChange hook forces tenant/workspace from
  the actor's membership; system/worker creates default to ETK (no record left unscoped).
- **`/app`** now shows workspace + tenant + role + a workspace-scoped summary; **`/platform`** adds a
  tenant-isolation health probe (flags any unscoped rows) + admin-split helper text.
- **Second-tenant isolation PROVEN** (`scripts/verify-tenant-isolation.ts`, run on prod via the migrate
  image; temporary Tenant B created → asserted → deleted): **all 26 checks PASSED** — A↔B mutual isolation
  across all 13 scoped collections, super sees both, anonymous = published-only / hard-deny on private,
  self-only membership reads, admin gate (super allowed / workspace blocked / anon blocked). No residue.
- **Live-verified:** migrations 13→14; **0 null tenant AND 0 null workspace across all 14 tables**;
  tenants/workspaces/memberships = 1/1/1 (no duplicates); published=3 + generation_runs=5 unchanged; all
  public routes 200; draft 404; `/admin` 200; `/api/health` 200; `/app`+`/platform` → 307 `/admin/login`;
  worker/Postgres/Caddy untouched; 0 jobs / 0 long-tx / 0 ungranted locks.

### Phase 14 migration
`20260616_080000_phase14_workspace_scoping` — additive/idempotent (workspace on 10 tables; tenant+workspace
on 4; backfill to ETK). Pre-validated in a rolled-back transaction on prod. Payload migrations **13 → 14**.

### Phase 14 DB backup
`/opt/exploringtoknow/backups/pre-phase14_20260616_234643.sql.gz` (verified before migration: gzip OK).

## Phase 13 — Multi-tenant SaaS foundation: COMPLETE & DEPLOYED (migration 12 → 13)
ExploringToKnow became **tenant/workspace #1** of the platform; the live magazine is untouched. See the
**ARCHITECTURE PIVOT** block at the top for the role/route/data blueprint + roadmap.
- **New collections:** Tenants, Workspaces, Memberships (admin group "Platform"); additive `tenant`
  relationship added to all 10 operational collections (media read stays public).
- **Server-side scoping** (`lib/tenant.ts`): `getTenantContext` (session → user → memberships),
  `requireSuperAdmin` / `requireWorkspaceMember`, `getPrimaryTenant`, tenant-scoped overviews. Tenant/role
  derived from the Payload session only — never from client input.
- **New surfaces:** `/platform` (super-admin, cross-tenant) + `/app` (workspace-member, tenant-scoped),
  premium `.adm` shell; `middleware.ts` extended to gate `/app` + `/platform` (presence check; authoritative
  gate is server-side in each page).
- **Migration `20260616_070000_phase13_multitenant` — additive + idempotent:** creates the 3 tables
  (+enums/indexes/FKs + `payload_locked_documents_rels` columns), adds nullable `tenant_id` to the 10 tables,
  **seeds** the ExploringToKnow tenant (`exploringtoknow`) + ETK Magazine workspace + a
  `platform_super_admin` membership for the owner user, and **backfills** every existing row to ETK.
  Idempotent guards throughout (CREATE TYPE in exception block, IF NOT EXISTS, ON CONFLICT, WHERE NOT EXISTS,
  WHERE tenant_id IS NULL). **Pre-validated in a rolled-back transaction on prod** before deploy.
- **Live-verified:** migrations 12→13; tenants/workspaces/memberships = 1/1/1 (no duplicates); **0 NULL
  tenant_id across all 10 tables**; backfill totals articles=5, categories=23, media=45, products=3, runs=5;
  **published=3 unchanged**, generation_runs=5 (no generation/approval triggered), article fingerprints stable;
  all public routes 200; draft + bogus author 404; `/admin` 200; **`/app` + `/platform` → 307 `/admin/login`**
  unauthenticated; worker/Postgres/Caddy untouched; 0 pending jobs / 0 long-tx.
- **Known follow-up:** the authenticated super-admin happy-path render of `/app` + `/platform` needs a
  logged-in browser pass (gating + build verified; couldn't drive an authenticated session via curl without
  credentials). Native `/admin` + collection `access` remain operator-wide (per-tenant tightening deferred to
  the "real second tenant" phase — see roadmap).

### Phase 13 migration
`20260616_070000_phase13_multitenant` — additive/idempotent. Payload migrations **12 → 13**.

### Phase 13 DB backup
`/opt/exploringtoknow/backups/pre-phase13_20260616_200717.sql.gz` (verified before migration: gzip OK).

## Phase 12 — Admin UI/UX Pro Redesign: COMPLETE & DEPLOYED (no migration)
The internal `/dashboard` operations console was upgraded from raw inline-styled pages into a
premium, structured **editorial operations console**:
- **Admin design layer** (`dashboard/dashboard.css`, scoped `.adm-*`) + shared components
  (cards, status badges, stat tiles, trend bars) — calm/premium SaaS feel; isolated from the
  public site and Payload's native admin.
- **Grouped sidebar nav** (Overview / Insights / Editorial / Intake / Pipeline) linking into the
  proper Payload collections + public site.
- **/dashboard** = editorial command center: system overview, **needs-attention** warnings
  (article pipeline + product-request triage), editorial-pipeline stats, activity (top viewed /
  recent requests / recent contacts), quick links. **/dashboard/analytics** (14-day trend +
  most-read table + delivery presence) and **/dashboard/health** (counts + provider presence +
  recent intake) restyled to match. Real data only; honest empty states; noindex + auth-gated.
- **Collection admin clarity** (admin-block-only — no fields/hooks/access/logic changed):
  Products (warns activate/force-generate triggers the pipeline + manual-image guidance),
  Newsletter (status meanings + local/no-send), Categories (merchandising fields), Authors
  (profile readiness + noindex-when-empty); improved `defaultColumns`.
- Payload's native `/admin` kept fully functional (deep-theming it was intentionally avoided to
  protect the admin bundle; the custom console is the operations layer).
- **No migration**; app-only deploy; worker untouched.

## Phase 12B — Native Payload /admin branding: COMPLETE & DEPLOYED (no migration)
The actual `/admin` interface (used daily) is now visibly branded, not raw default Payload:
- **Scoped admin CSS** injected via a CSS import in `app/(payload)/layout.tsx` — Payload 3.85.1
  has **no `admin.css` config key** (verified by typecheck; that approach was rejected), so the
  theme is imported in the admin route-group layout instead. `admin-theme.css` overrides Payload v3
  public theme variables (`--theme-bg` → warm paper; `html[data-theme]` scoping) and stable class
  hooks: `.btn--style-primary` → brand forest (login/save/create), branded left **nav** sidebar,
  card/heading polish. `admin.meta.titleSuffix` brands the browser tab.
- **Proven live (headless):** `/admin` title is now "… · ExploringToKnow Ops" and the brand color
  `#14543f` + button override are present in the deployed admin CSS bundle.
- **ProductRequests safety cue:** the status field gained a ⚠ description (approving creates a
  Product + enqueues ONE generation job) and a clearer "Approved (triggers generation)" option
  label — value unchanged; approval logic untouched.
- **Limitation:** deep per-component Payload restyling (custom Nav/Logo React components) was
  intentionally avoided — it needs the importMap and risks the admin bundle. The theme is delivered
  via the safe CSS-variable + stable-class-hook layer; final pixel polish needs a logged-in browser pass.
- No business logic, schema, or migration changed; app-only deploy; worker untouched.

## ⭐ Admin UI/UX — note
Both admin surfaces are now branded: the custom `/dashboard` operations console (Phase 12) AND
Payload's native `/admin` (Phase 12B, CSS-themed). A future pass could add custom Payload
components (branded Nav/Logo, list-cell status badges) via the importMap if deeper polish is wanted.

---

## Project Phase Tracker (where the project stands — plain English)

**Live now:** ExploringToKnow is a deployed, healthy content-commerce magazine at
https://exploringtoknow.com (Next.js 15 + Payload 3 + Postgres on a single VPS behind Caddy;
public site + Payload admin + internal dashboard + worker).

Completed, phase by phase:
- **P1 — Design system + homepage:** premium warm editorial design system (tokens, cards, buttons, header/footer) and redesigned homepage.
- **P2 — Navigation + search + article page:** scalable Topics mega menu + accessible mobile drawer; native published-only search + listing routes; premium article page (masthead, reading progress, TOC, disclosure, related).
- **P3 — Discovery layer:** redesigned category pages, topics hub, explore hub; search/listing polish; elegant empty states.
- **P4 — Trust + newsletter (foundation):** request-product form polish; newsletter capture (additive); About / Editorial Policy / Affiliate Disclosure pages; editorial footer.
- **P5 — Newsletter lifecycle + contact + SEO + deploy hardening:** subscriber lifecycle + confirm/unsubscribe (token-hashed); /contact + intake; sitemap/JSON-LD; the hardened, observable deploy script.
- **P6 — Growth infra:** Authors collection + author pages + bylines + Editorial-Team fallback; first-party article-view analytics; email provider layer (Resend-via-fetch, local-safe); category hero/SEO fields.
- **P7 — Growth/editorial ops:** pg_trgm search acceleration; analytics dashboard (7/30/all-time most-read); bot filtering; editorial inbox fields (status/reviewedBy/notify).
- **P8 — Editorial + growth completion (local-safe):** author longBio/expertise; weighted search ranking; admin System Health dashboard; category Buying-Guides/Reviews merchandising; env presence surfaces (present/missing only).
- **P9 — Email activation readiness + QA (verification + docs):** probed prod env (all provider keys missing → confirmed local-safe); verified local-safe flows; no defects found.
- **P10 — Editorial platform:** editorial overview dashboard (pipeline stats + warnings); pipeline/publish-gate clarity + content guardrails in admin; publishing-queue fields (editorialNotes, publishPriority); dashboard noindex.
- **P11 — Author SEO + analytics + merchandising:** author ordering + noindex-when-empty + sitemap-with-content; featured-topic surface; author-name search signal; 14-day analytics trend + product-request triage warnings.
- **P12 / P12B — Admin UI/UX:** premium `/dashboard` editorial operations console (`.adm` design layer + components) and native Payload `/admin` brand theming (CSS-variable + stable class-hook layer; titleSuffix).
- **P13 — Multi-tenant SaaS foundation:** ETK becomes tenant/workspace #1; Tenants/Workspaces/Memberships + additive `tenant` on 10 collections; server-side tenant scoping (`lib/tenant.ts`); `/platform` + `/app` gated consoles; additive seed+backfill migration (12→13). Public magazine unchanged.
- **P14 — Tenant isolation hardening + workspace scoping:** added `workspace` everywhere (+tenant on 4 more collections); TRUE server-side access control (`lib/access.ts`) on all scoped collections; `/admin` super-admin-only; client-ids never trusted on write (stamp hook); second-tenant isolation proven (26/26 checks); migration 13→14. Public magazine unchanged.

Big-picture summary of what's built:
- Core public magazine is live; premium public UI design system + homepage complete.
- Article / category / explore / search / buying-guides / reviews / request-product surfaces improved.
- Product-request **category validation** + **approval-hang** issues fixed (earlier baseline); **manual product-image population** + article image handling fixed; **category propagation** + **publish guards** fixed.
- Newsletter / contact / trust pages added in **local-safe / provider-ready** mode.
- Authors, author pages, author metadata, article bylines, and Editorial-Team fallback added.
- First-party analytics, most-read logic, bot filtering, and analytics/dashboard surfaces added.
- Search improved with **published-only safety** + ranking.
- Editorial dashboard / admin workflow visibility added.
- Deploy hardening, DB backups, rollback tags, route verification, and docs updates are now standard process.
- Existing **published content, affiliate links/rel, approval logic, generation logic, and image logic have been protected throughout** (additive migrations only; published fingerprints unchanged).

---

## Remaining Work / Future Roadmap

**A. Admin UI/UX Pro Redesign — HIGH PRIORITY (recommended next phase).**
Make the admin a professional editorial/content-commerce operations system, not raw CMS data entry:
premium visual theme; better spacing/hierarchy/typography/color/sizing; clearer dashboards + collection
layouts; status badges, filters, helper text, empty states, warnings, action areas; cleaner product-request
review, article/editorial workflow, contact inbox, and analytics presentation; friendlier admin nav; clear
visual separation of operational sections. Must keep all safety guarantees (no accidental approval,
generation, publishing, duplicates, or destructive actions). (Payload admin theming via custom CSS/views +
a polished `/dashboard` cockpit.)

**B. Real email-provider activation.** Code is provider-ready/local-safe. To go live, add on the VPS
`/opt/exploringtoknow/env/.env` (secrets via env only — never printed/committed): `NEWSLETTER_PROVIDER=resend`,
`RESEND_API_KEY`, `NEWSLETTER_FROM`, `NEWSLETTER_REPLY_TO`, `NEWSLETTER_DOUBLE_OPT_IN`, `CONTACT_NOTIFY_TO`;
recreate the app; verify via Dashboard → System Health (keys flip to "present") + a controlled test.

**C. Real-traffic analytics maturity.** Improve only where real data exists — unique/session signal,
referrer breakdown, longer time-series + charts, richer dashboard. No fabricated numbers.

**D. More content volume.** Generate → review → publish more buying guides/reviews so category/listing
surfaces gain depth (manual approval + publish gates remain).

**E. Category merchandising + SEO depth.** Category hero imagery, long descriptions, featured categories,
category SEO, topic curation, internal linking.

**F. Editorial workflow automation.** Assignment, review queues, editorial notes/priority, SLA-style
statuses, bulk actions, inbox triage.

**G. Human browser + accessibility QA.** Manual pixel testing at 320/375/640/768/1024/1440, mobile drawer,
keyboard nav, screen-reader basics, overflow/spacing/hierarchy (see QA_CHECKLIST.md).

## Phase 11 — Author SEO + richer analytics + category merchandising: COMPLETE & DEPLOYED (no migration)
- **Authors:** ordered by `sortOrder`; author pages are **noindex when they have no published work**;
  sitemap includes **only authors with published content**; Person JSON-LD + byline links retained.
- **Category merchandising:** categories ordered **featured-first → sortOrder → count → name**; `/explore`
  gains a **Featured topics** surface (renders only when categories are flagged `featured`).
- **Search:** added an **author-name signal** to published-only search (parameterized + safe fallback);
  field-weighted ranking (title > excerpt > category/author > body) retained. tsvector still deferred
  (trgm + app-layer ranking adequate at current scale).
- **Analytics/dashboard:** Analytics dashboard gains a **14-day daily-views trend** (privacy-light bars);
  the editorial overview gains **product-request triage warnings** (submitted requests missing
  category/permission/<3 images/URL). Admin-only; no fabricated data.
- **Migration-free** (read-layer + UI only). App-only deploy (`SKIP_MIGRATE=1`); worker untouched.

## Phase 10 — Editorial platform readiness: COMPLETE & DEPLOYED
- **Editorial overview dashboard** (auth-gated `/dashboard`): pipeline stats (published/
  ready-for-review/drafts; requests waiting/approved/processing; generation runs ok/
  flagged/failed/running; new contacts; active subscribers; total views), **pipeline
  warnings** (published/ready-for-review missing category/author/hero image), top-viewed
  (real analytics or honest fallback), recent requests/contacts, quick links. Admin-only.
- **Content-production clarity (no logic change):** Articles + GenerationRuns admin
  descriptions document the pipeline (Request → approve → Product → Intelligence/Brief →
  Article@ready_for_review → manual publish) and the **publish gate + editorial standards**
  (no hype/fabricated testing/medical claims; manual permission-confirmed images; affiliate
  disclosure auto-renders; human review before publish).
- **Publishing-queue fields (additive):** `articles.editorialNotes` + `articles.publishPriority`
  (admin-only triage; never auto-publish).
- **SEO:** dashboard marked `noindex` (defense-in-depth; already auth-gated). Sitemap remains
  published-only; `/search` + newsletter token pages noindex; canonicals/JSON-LD intact.
- **Read-only pipeline verification:** existing chain confirmed legible (Request #2 completed →
  Product 5 → Article 7, 10 permission-confirmed images); all published articles have
  category+author+product+hero (zero warnings). **No test record created**; no approval/generation.

### Phase 10 migration
`20260616_060000_phase10_editorial` — additive: `articles.editorial_notes` + `articles.publish_priority`. Pre-validated in a rolled-back transaction. Payload migrations **11 → 12**.

### Phase 10 DB backup
`/opt/exploringtoknow/backups/pre-phase10_20260616_054848.sql.gz` (verified before migration).

## Phase 9 — Email activation readiness + production QA: COMPLETE (verification + docs only)
- **Email provider env probed on production (presence only, never values): ALL MISSING**
  (`NEWSLETTER_PROVIDER`, `RESEND_API_KEY`, `NEWSLETTER_FROM`, `NEWSLETTER_REPLY_TO`,
  `NEWSLETTER_DOUBLE_OPT_IN`, `CONTACT_NOTIFY_TO`). Production therefore remains in
  **local-safe mode** — newsletter/contact captured, no external email sent. The
  provider-ready code path (Resend via fetch, token-hashed confirm/unsubscribe, contact
  notification, failure fallback) is built and unit/route-verified; **real deliverability
  is blocked only on adding the env values** (see activation block below) — no code change needed.
- **Local-safe flows verified live:** search no-results empty state, confirm/unsubscribe
  invalid-token friendly pages (`noindex,nofollow`), `/search` `noindex,follow`, newsletter
  trust copy ("No spam. Unsubscribe anytime"), author-field graceful omission.
- **UI/UX SSR review across all public pages found no clear defects** — no code change made
  (avoiding regression risk). Remaining items need human visual confirmation (see QA_CHECKLIST.md).
- **No deploy this phase** (docs only). App image/migrations unchanged from Phase 8.

---

## Current production state (verified live)

| Item | Value |
|---|---|
| Production HEAD | **`main @ 8a7e7ef`** (Phase 14; app image built from merge `3f82b5d`, +test-script fix) |
| Local `main` HEAD | matches prod |
| Running app image | `etk-web@sha256:9bb22b91…` (verified == freshly-built) |
| Worker / Postgres / Caddy | **Unchanged** — not rebuilt/recreated (worker up 2d, Postgres/Caddy up 6d, 0 restarts) |
| App health | Healthy, freshly recreated on Phase-14 image |
| Pending jobs / locks / long-tx | **0 / 0 / 0** |
| Payload migrations applied | **14** (latest `20260616_080000_phase14_workspace_scoping`) |

### Rollback points (prod tags)
`prod-pre-phase14-isolation → 74d5fac` · `prod-pre-phase13-multitenant → 4359697` · `prod-pre-phase12b-native-admin → 19b68e3` · `prod-pre-phase12-admin-pro-redesign → 41d9308` · `prod-pre-phase11-author-analytics-merch → 9aef1e8` · `prod-pre-phase10-editorial-platform → adccd7c` · `prod-pre-phase8-editorial-growth → 2f17557` · `prod-pre-phase7-growth-ops → fa171df` ·
`prod-pre-phase6-growth → f89eaea` · `prod-pre-phase5-magazine → 7975891` ·
`prod-pre-phase4-trust → 1bcd201` · `prod-pre-phase3-discovery → dcfb3bb` · `prod-pre-phase2-navsearch → 181e953`

---

## Completed phases (1–8)
Phases 1–7: design system, nav+search, discovery, trust+newsletter, newsletter
lifecycle+contact+SEO+deploy hardening, growth infra (authors/analytics/email layer/
category hero), growth+editorial ops (pg_trgm, editorial inbox, analytics dashboard,
bot filter). See git history.

**Phase 8 — Editorial + growth completion (LOCAL-SAFE email mode): COMPLETE & DEPLOYED.**
- **Email provider readiness (local-safe):** provider layer (Resend via fetch, default local) retained; `.env.example` now documents `NEWSLETTER_PROVIDER`, `RESEND_API_KEY`, `NEWSLETTER_FROM`, `NEWSLETTER_REPLY_TO`, `NEWSLETTER_DOUBLE_OPT_IN`, `CONTACT_NOTIFY_TO` as **empty placeholders**. Admin **System Health** + **Analytics** dashboards show each as **present/missing only — never values**. Confirm/unsubscribe remain token-hashed + friendly + idempotent. No real email sent (no provider env).
- **Multi-author model:** authors gain `longBio` + `expertise`; author page shows expertise chips + long bio; byline links to author with Editorial-Team fallback; `/author/[slug]` published-only + Person JSON-LD; bogus/inactive → 404.
- **Search ranking:** field-weighted relevance over published results (title > excerpt > category/author > body); pg_trgm acceleration + published-only gate unchanged; empty/special/long/mixed queries safe.
- **Analytics:** admin **System Health** dashboard (published/drafts/in-review/categories/authors/subscribers/active-subs/new-contacts/open-requests/media/total-views + recent contacts/requests); **Analytics** dashboard 7/30/all-time most-read; public "Most Read" uses real views else honest deterministic fallback (no fabricated counts); bot UA filtering on `/api/track`.
- **Category merchandising:** hero + SEO (Phase 6/7) retained; category pages now split into Buying Guides / Reviews **only when both types exist** (graceful single grid otherwise — no duplication); BreadcrumbList JSON-LD; published-only.
- **Editorial inbox:** contact statuses new/reviewed/archived/spam + reviewedBy/reviewedAt/notifyStatus/source (Phase 7) retained; Product Requests admin helper text — **manual approval + category-required + 3–30 images + permission all unchanged**.

### Phase 8 migration
`20260616_050000_phase8_authors` — **additive/idempotent**: `authors.long_bio` + `authors.expertise`. Pre-validated in a rolled-back transaction. Payload migrations **10 → 11**.

### Phase 8 DB backup
`/opt/exploringtoknow/backups/pre-phase8_20260616_051831.sql.gz` (verified before migration: gzip OK, required tables present, article data present).

---

## Email / newsletter provider — activation env (local-safe until set; secrets via env only)
```
NEWSLETTER_PROVIDER=local|resend     # default local (no external send)
RESEND_API_KEY=...                   # required for resend
NEWSLETTER_FROM="ExploringToKnow <hello@exploringtoknow.com>"
NEWSLETTER_REPLY_TO=...               # optional
NEWSLETTER_DOUBLE_OPT_IN=true|false   # optional
CONTACT_NOTIFY_TO=...                 # optional editorial inbox alerts
```
Dashboard → System Health / Analytics show each as **present/missing**. When unset: subscribers `active`/`local`, contact `notifyStatus=local_no_send`, no external email.

---

## Verified live routes (Phase 8)
`200`: `/`, `/categories`, `/category/sleep-wellness`, `/explore`, `/search`, `/search?q=led`,
`/buying-guides`, `/reviews`, `/request-product`, `/contact`, `/about`, `/editorial-policy`,
`/affiliate-disclosure`, `/newsletter/confirm`, `/newsletter/unsubscribe`,
`/author/exploringtoknow-editorial-team`, `/sitemap.xml`, published article.
**`404`:** draft, bogus author. **`307`** (auth): `/dashboard/health`, `/dashboard/analytics`.

---

## Safety & integrity (held through Phase 8)
Published-only gate intact (drafts 404; never in search/analytics/discovery; bot views filtered). No paid image API; manual-image system unchanged. No generation/approval triggered (`generation_runs` = 5); no auto-publish (published = 3). Article fingerprints (title/markdown/prose) **identical to baseline**. Affiliate URLs/rel unchanged. No duplicate articles/media/authors (media = 45, authors = 1). Additive migrations only; verified backup + rollback tag before deploy. No secrets in code/commits/logs.

---

## Known limitations
- Email delivery is **local-only until a provider is configured** (env block above) — Phase 8 built/verified the provider-ready path in local-safe mode; real deliverability is a future env step.
- Bot filtering is user-agent-based (best-effort); analytics has no sessions/unique-visit signal.
- Single author (Editorial Team) until more are created/assigned.
- Search ranking is application-layer; tsvector ranking deferred (trgm + JS weighting adequate at current scale).
- Manual browser pixel-level responsive + screen-reader QA still pending (`QA_CHECKLIST.md`).
- Content remains thin (3 published).

## Content quality guardrails (editorial policy — enforced by review + admin helper text)
- No hype; no fabricated testing/medical/performance claims; cautious, honest recommendation language.
- Distinguish "researched / reviewed / selected / tested" accurately — don't claim hands-on testing that didn't happen.
- Affiliate disclosure renders automatically on affiliate articles; affiliate links keep `sponsored nofollow noopener`.
- Product images are MANUAL, permission-confirmed uploads only — no AI/paid image generation.
- Human editorial review is required before publication; nothing auto-publishes; a category is required to publish.

## Phase 12 candidates
1. Configure Resend in prod env + verify real deliverability + enable double opt-in.
2. Real multi-author roster + assignment workflow + per-author SEO.
3. Analytics: unique/session signal, referrer breakdown, time-series charts.
4. Category hero imagery population + featured-topic curation surfaces.
5. tsvector full-text ranking atop pg_trgm as content grows.
6. Editorial workflow automation (assignment/SLAs) for contact + request queues.
