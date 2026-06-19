# PROJECT_STATE.md

> Current snapshot. Updated 2026-06-19 — **Blueprint v2 Phase 25 (Social Studio foundation): COMPLETE & DEPLOYED &
> VERIFIED LIVE.** Production HEAD `3d293c3`, image `etk-web` (id `sha256:96918ee9…`) healthy; **migrations 21**
> (phase25 social studio applied). New `/app/social-posts` Social Studio — manually author/review/organize/copy-export
> social post drafts connected to products/requests/landing pages/Brand Kit. Manual + clipboard export ONLY: no
> social/AI/scheduling/publishing/external calls. Distinct from the legacy `social-posts` AI pipeline (untouched).
> Email + billing still **local-safe**. Prior: Phase 24 landing enrich+analytics, Phase 23 landing foundation, Phase 22 brand kit.

---

# 🧭 MASTER BLUEPRINT v2 — Strategic Pivot (official)

> Numbering note: the Blueprint v2 phase numbers below are the **forward strategic plan**. Several early items
> already have a **shipped foundation** from prior implementation phases (multi-tenant, signup/trial, workspace
> console, product/request workflow, team invites/roles, **billing/plans/usage**). Those are cross-referenced
> as "foundation shipped" — the net-new work is the **marketing-OS output layer** (brand kit, landing pages,
> social, video, ads, optimization, domains, unified analytics). The detailed per-phase shipped history is
> preserved below this blueprint.

## 1. Master Blueprint v2 / Strategic Pivot
ExploringToKnow is no longer only a buying-guide magazine (or a magazine builder). It is a **multi-tenant
Owned Media + Social + Ads + Landing Page AI OS** — a controlled marketing operating system where a business
can **create, approve, publish, advertise, measure, and improve** content from one workspace.
- The **magazine is one output, not the whole product.**
- The SaaS platform supports **many tenants/workspaces**, each running its own content-commerce operation.
- The **ETK public magazine remains workspace #1 / live proof-of-concept** and must stay stable as the SaaS expands.

## 2. Core Product Model
**Input layer:** products · product URLs · affiliate links · product descriptions · product images ·
user-uploaded images · user-uploaded videos · brand profile · brand tone/style · logo/colors · audience ·
campaign goals · compliance notes / claims to avoid.
**Output layer:** editorial magazine articles · buying guides · product reviews · SEO content · landing pages /
affiliate bridge pages · social media posts · short-form video concepts / video outputs · ad campaign drafts ·
performance analytics · optimization recommendations.

## 3. Operating Principles (all current safety rules preserved)
- No auto-publish without approval. · No ad spend without approval. · No campaign launch without approval.
- No fabricated product claims. · No fake reviews. · No fake performance numbers.
- No client-provided tenant/workspace IDs trusted from the browser; **all workspace data stays server-scoped by membership.**
- Expensive outputs (video / ad generation) must be **plan/usage-gated**.
- Nothing destructive or cross-tenant is ever introduced.

## 4. Roles
- **Platform Super Admin:** full SaaS — tenants, workspaces, users, plans, billing, usage, system health, integrations, support, abuse monitoring.
- **Workspace Owner:** owns one workspace — brand, products, assets, links, team, content requests, landing pages, social drafts, ad drafts, analytics, settings.
- **Workspace Admin:** manages content/workflow, not ownership/billing/destructive settings (unless later permitted).
- **Editor:** creates/edits products, content, requests, landing pages, social drafts.
- **Viewer:** read-only.

## 5. Current completed foundation (shipped & live)
Public editorial magazine live · premium public UI · article/category/search/buying-guide/review/explore routes ·
newsletter foundation · contact/request system · super-admin dashboard · admin UI/UX polish · multi-tenant
foundation · Tenants/Workspaces/Memberships · server-side tenant isolation · signup/login/trial foundation ·
workspace console · product/request workflow · image upload for requests · team invitations & roles ·
super-admin vs workspace-owner route separation · product/request safety gates · **no auto-generation or
auto-publish** · billing/plans/usage-limits foundation (local-safe) · standard backup/rollback/deploy verification.

## 6. Updated roadmap from here (Blueprint v2)
- **Phase 19 — Workspace QA, Navigation & Owner Experience Polish.** Stabilize/polish the signed-up owner
  experience: signup/login/sign-out, owner/admin/editor/viewer permissions, /app routes, empty states, copy,
  CTA hierarchy, mobile, product-request flow, team-invite flow, hidden super-admin links. *(Foundation shipped;
  this is the QA/polish pass.)*
- **Phase 20 — Real Email Provider Activation.** Resend (or similar): welcome, invite, newsletter confirm,
  unsubscribe, contact + admin notifications, failure handling, provider status. No secrets committed.
- **Phase 21 — Billing, Plans & Usage Limits.** Stripe, trial→paid, plans, usage limits for products/workspaces/
  team/articles/social/landing/video/ad-drafts/connected-channels/monthly AI credits. *(Local-safe foundation
  shipped; this is real activation + the expanded output-type limits.)*
- **Phase 22 — Brand Kit, Asset Library & Product Data Foundation.** Central source of truth: brand profile,
  tone, logo, colors, product library, images, videos, affiliate links, compliance notes, audience, campaign
  goals, asset tagging/permissions.
- **Phase 23 — Landing Page Builder v1.** Product landing + affiliate bridge pages: CTA blocks, product-image
  blocks, benefits, FAQ, trust/disclosure, UTM-ready outbound links, draft/preview/publish, basic analytics.
- **Phase 24 — Social Content Studio v1.** Lower-cost first: text/image posts, captions, carousel outlines,
  hashtags, platform variants (IG/FB/TikTok/LinkedIn/YouTube Shorts/Pinterest later), content calendar,
  approval, manual export first.
- **Phase 25 — Social Account Connections & Publishing.** OAuth connections (Meta/IG/FB first, then LinkedIn/
  TikTok/YouTube), scheduled posts, published-post tracking, failed-post handling, platform formatting, approval required.
- **Phase 26 — Video Content Tier.** Higher-plan: Reel/TikTok/Shorts scripts, hooks, scenes, storyboards,
  voiceover, caption overlays, user-uploaded video, image-to-video concepts, optional AI video provider later,
  async jobs, AI-credit/plan gates.
- **Phase 27 — Ads Studio v1.** Ad creative + campaign drafts (Google/Meta/TikTok/LinkedIn/YouTube): objectives,
  audience suggestions, creative + copy variants, landing-page pairing, UTM suggestions, manual export first,
  **no spending/launching**.
- **Phase 28 — Ad Account Connections & Performance Data.** Read-only sync first (Meta/Google, then TikTok/
  LinkedIn): impressions, clicks, CTR, CPC, spend, conversions, landing-page clickouts, affiliate clicks,
  campaign/creative dashboards.
- **Phase 29 — Optimization Engine.** Detect low CTR / high CPC / weak landing pages / strong topics; suggest
  better hooks, new ad variants, landing-page improvements, audience tests, budget changes, social recycling,
  SEO/internal-linking. **Recommend only; never auto-apply without approval.**
- **Phase 30 — Custom Domains, White Label & Publishing Destinations.** Publish to ETK network, workspace-hosted
  magazine, own connected domain, or both; white-label for higher plans; canonicals, per-workspace/domain
  sitemap, disclosure, SSL/routing.
- **Phase 31 — Advanced Analytics & Attribution.** Unified across content/landing/social/ads/affiliate: views,
  clickouts, social + ad performance, referrers, UTMs, conversions, top products/articles/channels, time-series
  charts, workspace performance score, exportable reports.
- **Phase 32 — Content Volume & Demo Workspaces.** Investor/customer demos: more ETK content + demo workspaces
  (beauty, electronics, home, wellness, Amazon-seller, DTC) showing article + landing page + social + ad draft + analytics.
- **Phase 33 — Legal, Compliance & Launch Readiness.** Terms, Privacy, subscription terms, cancellation, AI
  disclosure, affiliate disclosure, user-content ownership, acceptable use, ad-account responsibility
  disclaimer, generated-content review disclaimer, abuse controls, data retention.

## 7. Updated MVP Definition (investor/customer-ready)
A business: signs up → creates workspace → adds brand/product/assets → uploads product images → creates a
product/article request → receives controlled drafts → creates an article → creates a landing page → creates
social post drafts → creates ad copy/campaign drafts → reviews/approves → **publishes only when approved** →
tracks performance → gets recommendations.

## 8. Valuation Narrative
> “ExploringToKnow is a multi-tenant AI operating system for content-commerce brands that turns product data
> into owned media, landing pages, social content, ad campaigns, and performance insights — with human
> approval, tenant isolation, and measurable marketing feedback loops.”

## 9. Immediate priority order
1. Finish current sign-out / workspace console cleanup (if not already complete). 2. Phase 19 workspace QA &
owner UX polish. 3. Phase 20 real email provider. 4. Phase 21 billing/plans/usage limits. 5. Phase 22 brand kit
+ asset library. 6. Phase 23 landing page builder. 7. Phase 24 social content studio. 8. Phase 25 social
account connection/publishing. 9. Phase 26 video tier. 10. Phase 27 ads studio. 11. Phase 28 ad performance
sync. 12. Phase 29 optimization engine. 13. Phase 30 custom domains/white label. 14. Phase 31 advanced
analytics. 15. Phase 32 demo workspaces/content volume. 16. Phase 33 legal/compliance/launch readiness.

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
`/opt/exploringtoknow/backups/pre-phase15_20260617_021233.sql.gz` (verified before migration: gzip OK).

### Blueprint v2 Phase 25 — Social Studio foundation: COMPLETE & DEPLOYED (migration 20 → 21)
First workspace-scoped Social Studio: owner/admin/editor **manually** create, review, organize, and copy-export
social post drafts connected to products / requests / landing pages / Brand Kit. **Additive** — one NEW collection +
an additive/idempotent migration. **Manual authoring + clipboard export ONLY** — no social-network API/OAuth, no
auto-posting, no scheduling execution, no AI generation, no email/billing/ad/image/video/external calls. Public
magazine + platform/admin/dashboard gates + email & billing local-safe modes + Phase 23/24 landing behavior all unchanged.
- **Design decision — NEW collection, legacy left intact:** the pre-existing `social-posts` collection is wired into
  the AI/worker FB+IG **publish pipeline** (article-based, `platform`/`scheduledFor`/`publishedAt`). Phase 25 adds a
  SEPARATE collection **`social-studio-posts`** for the manual marketing-OS studio, so the worker pipeline is never
  touched. (`social_posts` table confirmed unchanged, 0 rows, post-deploy.)
- **New scoped collection `social-studio-posts`:** internal `name`; `channel` (instagram / tiktok / youtube_shorts /
  linkedin / facebook / x_twitter / pinterest / generic); `format` (text / image_post / carousel/short_video/story/
  reel placeholders); `status` (draft / ready_for_review / approved_to_copy / archived); hook, caption, hashtags[]
  (normalized), CTA label + URL (http(s) only), disclosure, platform notes, internal notes; relatedProduct/
  relatedRequest/relatedLandingPage/relatedBrandProfile; approvedAt, copyCount/copiedAt; createdBy/updatedBy; tenant/
  workspace. `scopedRead('deny')` + super-only native mutate + `stampTenantWorkspace`. **No binary upload** (references
  only — consistent with Phase 22/23).
- **Migration `20260619_010000_phase25_social_studio`:** create `social_studio_posts` (3 enums, indexes, product/
  request/landing-page/brand-profile/user/tenant/workspace FKs, locked-doc rel). Additive + idempotent; `down()` drops
  the table + 3 enums + locked-rel column safely. **Pre-validated in a rolled-back tx on prod** (26 columns + all FKs OK).
- **APIs:** `/api/app/social-posts` (create) + `/api/app/social-posts/[id]` (PATCH update, POST status action /
  `copied` counter, DELETE) — `canWrite` (owner/admin/editor); tenant/workspace + createdBy/updatedBy **server-derived**;
  post ownership re-verified on every edit/action/delete; CTA URL validated (rejects `javascript:`/`data:`); related
  refs accepted **only if they belong to the actor's workspace** (`relationInWorkspace` over products / requests /
  landing-pages / brand-profiles — cross-tenant ids ignored). **Approve-to-copy is the furthest a post goes** — there is
  NO publish/schedule/platform call anywhere. The `copied` action is a first-party usage counter (no external call),
  allowed only once approved.
- **Console UI `/app/social-posts`** (list / new / [id], premium style): status + channel/format badges, role-aware
  controls (viewer read-only), **live preview/copy panel** (composes hook→caption→CTA→hashtags→disclosure; clipboard
  export with non-browser fallback), per-channel honest helper copy, product/request/landing-page pickers (with manual
  "Use link → CTA" prefill), Brand Kit helper (voice/audience/accent/disclosure) + "use brand disclosure", hashtag
  normalizer. Sidebar **"Social Studio"** under Content.
- **Create-from-landing-page (item 11, shipped):** landing-page detail gains a **"Create social post"** action →
  `/app/social-posts/new?fromLanding=<id>` preselects the landing page + prefills the CTA from its (published) public
  URL into a **draft**. No copy generated, no publish, no API.
- **Rollback tag `pre-phase25-social → 588145a`; backup `pre-phase25_20260619_055625.sql.gz` (gzip-verified).**
- **DEPLOYED & VERIFIED LIVE 2026-06-19** (on the VPS as `deploy` via sudo): prod HEAD `3d293c3`; image `etk-web`
  (id `sha256:96918ee9…`) healthy; worker/postgres/caddy untouched. **payload_migrations 20 → 21** (phase25 applied,
  18ms); `social_studio_posts` table + 26 columns + locked-rel confirmed via psql; legacy `social_posts` untouched.
  Content unchanged (gen 5/art 5/media 45); 0 pending jobs. Routes: public magazine 200; `/app/social-posts`(+`/new`)/
  `/app`/`/platform`/`/dashboard` → 307; `/admin` → 200. **Verified via temp owner (created→checked→deleted, zero
  residue):** unauth create **401**; CTA `javascript:` → **422**; valid draft created; **cross-tenant `relatedProduct`
  (ETK product) stored null**; **foreign `relatedLandingPage` stored null**; post **stamped to the temp tenant (not
  ETK)** and **ETK had 0 social posts** (isolation); approve → `approved_to_copy` (approvedAt set); `copied` → copyCount
  1 (copiedAt set); new-post page pickers **scoped** ("No products/requests yet" — no ETK leak), zero `/admin/collections`
  links. Temp tenant/user/workspace/membership/post fully deleted (tenants/users back to baseline; gen 5/art 5/media 45
  unchanged). No secrets printed/committed; no generation/approval/publish/email/billing/social/ad/image/video/external
  side effects; affiliate logic unchanged.

### Blueprint v2 Phase 24 — Landing Page enrichment + analytics: COMPLETE & DEPLOYED (migration 19 → 20)
Enriches Phase 23 landing pages: workspace product/request picker + CTA prefill, structured sections, Brand Kit
helper context, and **real** first-party view analytics. **Additive** — one new column + one new table. Still
manual, tenant-scoped, no AI/auto-publish/external/ad/social/image calls.
- **Product/request picker:** editor selects a workspace product or product-request; the relation is **verified
  server-side to belong to the workspace** (`relationInWorkspace`) — cross-tenant ids are ignored (tamper-proof).
  Empty states link to `/app/products` and `/app/product-requests`.
- **CTA prefill (manual):** a button copies the selected product/request affiliate/product URL into the CTA URL
  field; the user must review + save. Validated http(s) only (rejects `javascript:`/`data:`/etc.); global affiliate
  logic untouched.
- **Structured sections (`landing_pages.sections` jsonb):** types text / feature_list / pros_cons /
  product_highlight / disclosure / faq_placeholder / cta_block — **whitelisted + normalized server-side**
  (`normalizeSections`), rendered **escaped** on the public page (no raw HTML; section CTA URLs http(s)-only). The
  Phase 23 `body` is preserved and rendered as a fallback when there are no sections (existing pages keep working).
- **Brand Kit integration:** editor shows publication/voice/accent/disclosure helper context + a "use brand
  disclosure" fill; soft prompt to `/app/brand` when absent. No Brand Kit data duplicated.
- **Analytics (`landing-page-views`, mirrors article-views):** one row per (published page, UTC day) incremented
  by `/api/lp-track` (published-only, bot-filtered, privacy-light — no IP/PII; tenant/workspace copied from the
  page). Real counts shown on the list + detail (server-scoped to the workspace). No fake/placeholder metrics.
- **Migration `20260618_030000_phase24_landing_enrich`:** `ALTER landing_pages ADD sections jsonb` + create
  `landing_page_views` (+indexes/FKs/locked-doc rels). Additive + idempotent; `down()` drops both safely.
- **Rollback tag `pre-phase24-landing-enrich → 91b817e`; backup `pre-phase24_20260619_012220.sql.gz` (gzip-verified).**
- **DEPLOYED & VERIFIED LIVE 2026-06-19** (on the VPS as `deploy` via sudo): prod HEAD `b11d01d`; image
  `etk-web@sha256:97024fcf…` healthy; worker/postgres/caddy untouched. **payload_migrations 19 → 20** (applied,
  24ms); `sections` jsonb + `landing_page_views` confirmed via psql. Content unchanged (gen 5/art 5/media 45).
  Routes: public magazine 200; `/app/landing-pages`/`/app`/`/platform`/`/dashboard` → 307; `/admin` → 200;
  `/lp/*/missing` → 404. **Verified via temp owner (created→checked→deleted, zero residue):** cross-tenant
  `relatedProduct` **rejected** (stored null) · top-level CTA `javascript:` → 422 · section `javascript:` CTA
  **stripped** (0 in rendered HTML) · sections render on the public page · publish → public 200 · **analytics
  counted 2 real pings, excluded the bot ping**, scoped to the temp tenant (ETK had none). No secrets printed.
  _(First build attempt failed on a strict `noUncheckedIndexedAccess` swap + a union-narrowing access; fixed; deploy
  aborts before migrate on build failure so prod was never at risk.)_

### Blueprint v2 Phase 23 — Landing Page foundation: COMPLETE & DEPLOYED (migration 18 → 19)
First workspace-scoped landing-page system: owner/admin/editor create, edit, preview, and **manually** publish
simple pages. **Additive** — one new collection + an additive/idempotent migration. **No AI/generation, no
auto-publish, no external/ad/social/image-API calls, no email, no billing/Stripe.** Public magazine + platform/
admin/dashboard gates + email & billing local-safe modes all unchanged.
- **New scoped collection `landing-pages`:** title, slug (**unique per workspace** via a DB unique index), status
  (draft / ready_for_review / published / archived), pageType (affiliate_bridge / product_promo / lead_capture_
  placeholder / general), headline, subheadline, body (plain text → paragraphs), CTA label + URL (http(s) only),
  disclosure text, SEO title/description, noindex (default on), publishedAt, relatedProduct/relatedRequest,
  createdBy/updatedBy, tenant/workspace. `scopedRead('deny')` + super-only native mutate + `stampTenantWorkspace`.
- **Migration `20260618_020000_phase23_landing_pages`:** table, 2 enums, indexes, `UNIQUE(workspace_id, slug)`,
  product/request/user/tenant/workspace FKs, locked-doc rels. Additive + idempotent.
- **APIs:** `/api/app/landing-pages` (create) + `/api/app/landing-pages/[id]` (PATCH update, POST status action,
  DELETE) — `canWrite` (owner/admin/editor); tenant/workspace + createdBy/updatedBy **server-derived**; page
  ownership re-verified on every edit/delete; CTA URL validated (rejects `javascript:`/`data:`); **publish is an
  explicit, guarded action** (requires title+slug; never automatic).
- **Console UI `/app/landing-pages`** (list / new / [id], premium style): status badges, role-aware controls
  (owner/admin/editor edit; viewer read-only), brand-kit empty-state hint, helper copy ("reviewed and published
  manually — nothing is generated or published automatically"). Sidebar link under Content.
- **Public route `/lp/[workspaceSlug]/[slug]`:** renders **only published** pages (draft/archived/missing/wrong-
  workspace → 404); uses the workspace Brand Kit colors (hex-validated, no CSS injection); CTA validated +
  `rel="nofollow sponsored noopener"`; disclosure shown when set; `noindex` respected (default no-index).
- **Brand Kit integration:** the list/new pages prompt to set up `/app/brand` when no profile exists; the public
  page reads brand colors. No Brand Kit data duplicated. Asset references only — no binary upload added.
- **Rollback tag `pre-phase23-landing → 173c389`; backup `pre-phase23_20260618_231405.sql.gz` (gzip-verified).**
- **DEPLOYED & VERIFIED LIVE 2026-06-18** (on the VPS as `deploy` via sudo): prod HEAD `9bcc25c`; image
  `etk-web@sha256:b9202591…` healthy; worker/postgres/caddy untouched. **payload_migrations 18 → 19** (applied,
  19ms); table/columns/enums/unique-index confirmed via psql (exact config match). Content unchanged (gen 5/art 5/
  media 45). Routes: public magazine 200; `/app/landing-pages`/`/app`/`/platform`/`/dashboard` → 307; `/admin` → 200;
  `/lp/*/missing` & `/lp/missing/*` → 404. **Verified via temp owner (created→checked→deleted, zero residue):**
  create draft → draft hidden (404) → CTA `javascript:` rejected (422) → explicit publish → public page live (200,
  content rendered) → cross-workspace `/lp/exploringtoknow/<slug>` → 404 (isolation; total landing_pages scoped to
  the temp tenant, ETK had none) → owner/auth role gate enforced. No secrets printed/committed.

### Blueprint v2 Phase 22 — Brand Kit / Asset Library foundation: COMPLETE & DEPLOYED (migration 17 → 18)
Workspace-level brand identity + asset foundation that future outputs (magazine, landing pages, social, video,
ads) will draw on. **Additive** — two new workspace-scoped collections + an additive/idempotent migration. No AI/
generation/approval/publish/image/email/billing/Stripe/external calls; public magazine + platform/admin/dashboard
gates + email & billing local-safe modes all unchanged.
- **New scoped collections:** `brand-profiles` (one per workspace — brand/publication name, description, target
  audience, voice/tone, editorial style, primary/accent color, website, social links, affiliate-disclosure notes,
  focus notes) and `brand-assets` (metadata entries: label, type [logo/brand image/product image/document/link/
  other], permission [user-provided/permission-cleared/needs-review/unknown], source URL, notes). Both
  `scopedRead('deny')` + super-only native mutate + `stampTenantWorkspace`. **No binary upload pipeline** this
  phase (per safety guidance) — assets are references/metadata; the tenant-safe Media store can be wired later.
- **Migration `20260618_010000_phase22_brand_kit`:** 2 tables, 2 enums, indexes, tenant/workspace FKs, and the
  `payload_locked_documents_rels` columns. Additive + idempotent (guarded CREATE TYPE / IF NOT EXISTS / guarded FKs).
- **Data layer + access:** `lib/brandkit.ts` (workspace-scoped reads), `lib/brandkit-constants.ts` (client-safe
  labels), `canManageBrand` (owner **or** workspace admin). Routes `/api/app/brand` (upsert profile) and
  `/api/app/brand/assets` (create + delete) are owner/admin-gated; tenant/workspace are **server-derived** (client
  ids ignored); delete re-verifies workspace ownership before removing.
- **UI:** `/app/brand` (premium console style) — owner/admin get the editable brand form + asset manager; viewer/
  editor get a read-only view. Empty states + helper copy ("powers every future output"). Sidebar link under Content.
- **Rollback tag `pre-phase22-brandkit → 4a2736d`; backup `pre-phase22_20260618_202657.sql.gz` (gzip-verified).**
- **DEPLOYED & VERIFIED LIVE 2026-06-18** (on the VPS as `deploy` via sudo): prod HEAD `4ea5b66`; image
  `etk-web@sha256:11d175ad…` healthy; worker/postgres/caddy untouched. **payload_migrations 17 → 18** (phase22
  migration applied cleanly, 32ms). New tables/columns/enums confirmed via psql (exact snake_case match to config).
  Content unchanged (gen 5/art 5/media 45). Public routes 200; `/app/brand`/`/app`/`/platform`/`/dashboard` → 307
  (gated); `/admin` → 200. Email + billing still local-safe. **Tenant isolation, Payload config↔DB match, and the
  owner/admin role gate verified via a temp owner (signup → created brand profile + asset → rendered on /app/brand;
  only the temp tenant held brand data, ETK had none; unauth POST → 401) → temp account fully deleted, zero residue.**
  No secrets printed/committed. _(First build attempt failed fast — a client component imported a server-only module;
  fixed by splitting client-safe constants. Deploy aborts before migrate on build failure, so prod was never at risk.)_

### Blueprint v2 Phase 21 — Billing / Plans / Usage real activation (Stripe-ready production path): COMPLETE & DEPLOYED (no migration)
Completes the Stripe-ready production billing path on top of the Phase 19 foundation. **Additive, no
schema/migration**, and **still INERT without Stripe env** — production has no billing/Stripe keys, so it stays
**local-safe: no real charges, no checkout/portal, inert webhook.** No generation/approval/publish/affiliate/
image/email change; tenant isolation and the public magazine untouched.
- **Plan reflection (core fix):** `/api/app/billing/checkout` now passes the plan id in session + subscription
  metadata; the webhook sets `tenant.plan` (and thus limits) on `checkout.session.completed`, so a real
  purchase actually grants the purchased plan. Only a known **selectable paid** plan id is honored.
- **Portal-driven plan changes reflect:** new `planByPriceId()` maps the active Stripe price id back to a plan;
  the webhook applies it on `customer.subscription.*` updates (fallback: subscription metadata plan).
- **Inactive-subscription enforcement:** `getTenantPlan` now exposes `restricted` (canceled/unpaid → new
  create actions blocked server-side via `workspaceCapability`, data stays readable) and `pastDue` (grace —
  warn only). Comped (ETK) remains unlimited; trial-expiry behavior unchanged.
- **UI:** `/app/billing` adds **inactive** and **past-due** banners; the Enterprise card shows **“Contact
  sales”** (→ `/contact`) instead of an erroring upgrade button. Plan cards, usage meters, and the
  “online checkout isn’t active” notice (when `billingLive()` is false) unchanged from Phase 19.
- **Owner-only & workspace-scoped:** checkout/portal owner-gated (`canManageSettings`); tenant/plan derived
  from session; webhook updates only the single matching tenant (by client_reference_id / metadata / customer).
- **No real charges without env + explicit test mode:** activation requires `BILLING_ENABLED=true` +
  `STRIPE_SECRET_KEY` (+ `STRIPE_PRICE_*`, `STRIPE_WEBHOOK_SECRET`); use Stripe **test mode** first. `.env.example`
  already documents these (local-safe placeholders).
- **Rollback tag `pre-phase21-billing → 27df9d6`. No DB migration → no backup needed.**
- **DEPLOYED & VERIFIED LIVE 2026-06-18** (app-only, `SKIP_MIGRATE=1 deploy-app.sh`, on the VPS as `deploy`
  via sudo): prod HEAD `dfa94f5`; image `etk-web@sha256:6536c7ee…` healthy; worker/postgres/caddy untouched.
  **payload_migrations 17 → 17 (unchanged)**; content unchanged (gen 5/art 5/media 45). **All billing/Stripe env
  absent → local-safe, no charges; webhook inert** (`ignored: billing-not-configured`, no DB write). Public
  routes 200; `/app`/`/app/billing`/`/platform`/`/dashboard` → 307 (gated); `/admin` → 200. Email still
  local-safe (Phase 20 preserved). UI states (plan cards, usage meters, disabled checkout/portal, upgrade/
  Contact-sales buttons, trial/inactive/past-due banners) verified by code + local-safe behavior; no temp
  billing records created. No secrets printed/committed; tenant isolation unchanged.

### Blueprint v2 Phase 20 — Real Email Provider Activation: COMPLETE & DEPLOYED (no migration)
Activates the real email-provider layer (Resend, fetch-only, no SDK) while preserving the existing
local-safe fallback. **Additive, no schema/migration**, no generation/approval/publish/affiliate change.
Production currently has **all six email env keys absent**, so prod stays **local-safe**: flows complete,
status rows record `local_no_send`, nothing is sent. Real delivery is **provider-ready, pending env**.
- **`lib/email.ts` hardened:** added `emailProviderStatus()` — reports provider, active flag, mode
  (`real-send` / `local-safe`), double-opt-in flag, **missing required keys by NAME only**, per-key presence,
  and per-flow readiness (welcome / team-invite / newsletter-confirm / unsubscribe / contact-notify). **Never
  prints or returns any secret value.** Kept fetch-only Resend send + `local_no_send` fallback (idempotent,
  no raw token/key ever logged).
- **`lib/email-templates.ts` (new):** shared brand-consistent HTML + text wrapper (`renderEmail`), plus
  `sendWelcomeEmail`, `sendInviteEmail`, `sendNewsletterConfirm`. Honest copy (no hype), ETK / owned-media-OS
  positioning, safe fallback when workspace name is missing; all senders no-op (`local_no_send`) when the
  provider is inactive so callers never branch on env.
- **Welcome email** wired into `/api/auth/signup` — best-effort after onboarding (workspace name, trial days,
  `/app` link, "add product / request article / review before publish", "nothing publishes automatically");
  wrapped in try/catch so **signup always completes** even if the send fails.
- **Team-invite email** wired into `/api/app/team/invite` — sends when active, records the real result into the
  invitation's `emailStatus`, and **always returns the copyable secure link** (single-use hashed token, wrong-
  email / duplicate / seat-limit protections unchanged). `TeamManager` now shows **"we've emailed the
  invitation"** vs the copy-link fallback based on the returned `emailed` flag.
- **Newsletter confirm** now uses the branded template (double opt-in behavior unchanged; still gated by
  `emailEnabled() && NEWSLETTER_DOUBLE_OPT_IN=true`). Unsubscribe (hashed-token, idempotent) unchanged.
  **Contact notification** already best-effort (`CONTACT_NOTIFY_TO`, `notifyStatus`, never blocks the user) —
  retained.
- **Admin visibility:** `/dashboard/health` now renders provider+environment (presence only, missing-to-activate
  by key name) and a per-flow readiness table (`real-send` vs `local-safe`). No secret values anywhere.
- **Validation:** changed pure-TS files typecheck clean (local standalone `tsc` can't resolve workspace
  `next`/`react`/`@types/node` — environmental, not code). Real gate is the Docker prod build at deploy.
- **Env model (env-only, no hardcoding):** `NEWSLETTER_PROVIDER=resend`, `RESEND_API_KEY`, `NEWSLETTER_FROM`,
  `NEWSLETTER_REPLY_TO` (optional), `NEWSLETTER_DOUBLE_OPT_IN=true`, `CONTACT_NOTIFY_TO`. Missing → local-safe.
- **Rollback tag `pre-phase20-email → 125d114`** (last deployed state). **No DB migration → no backup needed.**
- **DEPLOYED & VERIFIED LIVE 2026-06-18** (app-only, `SKIP_MIGRATE=1 deploy-app.sh`, run on the VPS as
  `deploy` via sudo): production HEAD `40174e6`; freshly built image `etk-web@sha256:13af565b…` running and
  **healthy**; worker/postgres/caddy untouched. **payload_migrations 17 → 17 (unchanged, no migration)**;
  content unchanged (generation_runs 5 / articles 5 / media 45). **All six email env keys absent → local-safe;
  no real email sent.** Routes verified: `/ /signup /login /request-product /categories /search /sitemap.xml
  /api/health` → 200; `/app /platform /dashboard` → 307 (gated); `/admin` → 200 (Payload login). No secrets
  printed/committed; no generation/approval/publish/image/affiliate/content change; tenant isolation unchanged.
  Transport: git bundle over SSH → fast-forward `main` 125d114 → 40174e6 (established no-remote pattern).

### Blueprint v2 Phase 19 — Workspace QA, Navigation & Owner UX polish: COMPLETE & DEPLOYED (no migration)
UX/QA polish of the authenticated workspace console (the customer SaaS layer), ahead of email/Stripe/landing/
social/ads activation. No schema/business-logic change; app-only deploy.
- **Auth fix:** `/api/auth/logout` GET now redirects to `PAYLOAD_PUBLIC_SERVER_URL` (never an internal/
  localhost host that the proxy may place on `req.url`) — sign-out always lands on the public homepage. Signup/
  login auto-login + `/app` redirects use relative paths (verified no local/dev URL leaks to users).
- **/app dashboard:** role-aware quick links (owner → Invite team + Billing; writers → Request an article);
  aligned onboarding copy; new **“More from your workspace”** positioning surface (Landing pages · Social ·
  Short-form video · Ad campaigns · Performance insights — labeled **planned / coming soon**, not overpromised),
  positioning ETK as an owned-media OS where the magazine is the first output.
- **Verified live (temp owner, created→checked→deleted):** signup→`/app` 200; **all 13 `/app/*` pages render
  200**; **logout → `https://exploringtoknow.com/`** (not localhost); **zero** `/admin`//platform//dashboard//
  admin-collections/Payload-CMS links in `/app`; gates intact (`/platform`+`/dashboard` → 307 `/app`, unauth
  `/app` → 307 `/login`, `/admin` denied); public routes 200, draft 404; isolation intact; generation_runs=5 /
  articles=5 / published=3 / media=45 / fingerprints stable; jobs/locks 0; worker untouched; residue 0.
  Rollback tag `prod-pre-phase19v2-polish → f83367e`. (No DB migration → no backup needed.)

### Phase 19 — Billing / Plans / Usage limits foundation: COMPLETE & DEPLOYED (migration 16 → 17)
SaaS monetization foundation, **local-safe** (no real charges without Stripe env). Additive only; no
generation/approval/publish/affiliate/content change.
- **Plans (`lib/plans.ts`, single source of truth):** trial / starter / pro / agency / enterprise / comped,
  each with limits (teamMembers, requestsPerMonth, mediaUploads, customDomain). Used by both UI and enforcement.
- **Tenant billing fields + migration `20260617_020000_phase19_billing`:** `subscription_status` enum +
  billing_subscription_id / current_period_start/end / cancel_at_period_end (plan/trial*/billingCustomerId
  already existed). ETK backfilled to `comped` (unlimited). Pre-validated in a rolled-back tx.
- **Usage + enforcement (`lib/billing.ts`):** real counts (`getWorkspaceUsage`), `getTenantPlan`,
  `workspaceCapability(action)`. Enforced **server-side** in product-requests / upload / team-invite — over
  limit → **402** + upgrade message; comped/unknown = unlimited (ETK never blocked); trial-expired blocks new
  create actions but keeps data readable. Scope derived from session (client tenant/workspace ids ignored).
- **Stripe-ready routes (fetch-only, no SDK):** `/api/app/billing/checkout` + `/portal` (owner-only;
  server-side price ids from plan config; **local-safe disabled** response without env) and
  `/api/billing/webhook` (HMAC signature verify, idempotent, matching-tenant-only, **inert** without env).
- **UI:** `/app/billing` (plan/status/trial banner, usage meters, plan cards, upgrade buttons, expired
  banner) — **owner-only** sidebar link + page guard. `/platform` gained a billing aggregate (status counts +
  provider present/missing, no secrets). `.env.example` STRIPE_*/BILLING_* placeholders (empty).
- **Verified (temp trial owner, created→checked→deleted):** `/app/billing` 200; checkout/portal return
  local-safe disabled; webhook inert 200; **trial limit enforced** (3 requests OK, 4th → 402 upgrade);
  **tamper with client tenant/workspace ids still 402**; created requests scoped to the temp tenant; **ETK
  isolation intact** (requests unchanged) and ETK = comped; generation_runs=5 / articles=5 / published=3 /
  fingerprints stable; jobs/locks 0; worker untouched; residue 0. Rollback tag
  `prod-pre-phase19-billing → b81aa7a`; backup `pre-phase19_20260617_234219.sql.gz`.
- **Deferred:** real Stripe activation (provider-ready; needs env + test-mode verification); proration/seat
  metering; usage-reset cron (monthly window is computed from createdAt, not a stored counter — accurate, no cron needed).

### Phase 18 — Team invitations + workspace roles: COMPLETE & DEPLOYED (migration 15 → 16)
Each workspace is now multi-user: an owner invites teammates (admin/editor/viewer) and manages roles, fully
tenant-scoped. Additive only; no generation/approval/publish/affiliate/content change.
- **Roles** (existing Memberships enum): `workspace_owner` (full + team/settings), `workspace_admin` (content,
  no owner-only settings), `editor` (create/edit products/requests + upload), `viewer` (read-only). Permissions
  in `lib/roles.ts` (`canWrite`/`canManageTeam`/`canManageSettings`); enforced server-side AND in the UI.
- **WorkspaceInvitations** collection + migration `20260617_010000_phase18_invitations` (table/enums/indexes/FKs
  + locked_documents_rels column), pre-validated in a rolled-back tx. Hashed token (raw token only in the link).
- **APIs (server-authorized, scoped):** `/api/app/team/invite` (owner-only; validates email; blocks duplicate
  pending invite + existing member; local-safe link, `emailStatus=local_no_send`), `/api/app/team/manage`
  (role/remove/revoke; **last-owner can't be demoted/removed**; never assigns platform_super_admin; cross-tenant
  tamper checks), `/api/auth/accept-invite` (logged-in **email-match** OR new signup into the **invited**
  workspace — no new tenant; single-use; wrong-email→403; expired→410). Write APIs now 403 for viewers.
- **Pages:** `/app/team` (members + pending invites + owner invite form + copyable link), `/invite/[token]`
  public accept (logged-out create/login, logged-in accept, mismatch/expired/used friendly states). Sidebar Team item.
  Role-aware: viewers see no create/upload/invite CTAs; create pages show a read-only panel.
- **Verified (temp owner+viewer, created→checked→deleted):** invite→accept created exactly the owner+viewer
  memberships; invite marked accepted (scoped); duplicate 409, invalid email 422, reuse 410, wrong-email 403,
  viewer write 403; ETK isolation (0 leaked invites); **generation_runs=5, articles=5, published=3, media=45
  unchanged; fingerprints stable**; jobs/locks 0; worker untouched; all temp data removed (residue 0).
  Rollback tag `prod-pre-phase18-team → 0486528`; backup `pre-phase18_20260617_211528.sql.gz`.
- **Deferred:** admin-initiated invites (owner-only this phase); per-page granular admin-vs-editor content
  permissions beyond viewer/non-viewer; real email sending (provider-ready, local-safe today).

### Phase 17 — Workspace product + article-request creation workflow (no migration, app-only deploy)
`/app` gained its first real **write workflow**: a workspace owner can create product/article requests with
image upload, fully tenant/workspace-scoped — no Payload admin, no ETK data, no generation/approval/publish.
No schema change.
- **Creation entity = ProductRequest** (the platform's editorial-reviewed intake; has productName, free-text
  brand, URL, notes, category, images, permission). Status is always **`submitted`** — never approved/enqueued.
- **`/api/app/upload`** — session-scoped image upload; Media stamped with the actor's tenant/workspace
  (server-derived); JPEG/PNG/WebP ≤8MB; **401** for anon. **`/api/app/product-requests`** — session-scoped
  request create; server-side category validation (must exist+active; "Other" needs a suggestion); explicit
  server-derived tenant/workspace (**client ids never trusted**); **401** for anon.
- **Pages:** `/app/products/new`, `/app/product-requests/new` (premium `CreateProductForm`: searchable
  category, image uploader + permission, validation, anti-double-submit), `/app/product-requests/[id]`
  (scoped detail w/ ownership check → notFound on mismatch). Wired `/app/products`, `/app/product-requests`,
  and the `/app` dashboard "Add a product".
- **`/app/editorial`:** requests-by-status, needs-attention warnings (submitted requests missing
  category/permission, drafts to review), next-action, recent products.
- **`.adm`-scoped form styles** added to dashboard.css so console forms match the premium theme (no site.css leak).
- **Verified (temp owner, created → checked → deleted):** create pages 200; uploaded 1 image (Media scoped to
  the temp workspace, NOT ETK) + created exactly 1 ProductRequest (status submitted, tenant/workspace = temp);
  **generation_runs unchanged (5), no product/article auto-created, no approval/publish**; ETK isolation intact;
  all temp data removed (residue 0). Public routes 200, draft 404; every `/app/*` (incl. `/new`) → 307 `/login`
  unauth; both write APIs → 401 anon; jobs/locks 0; worker untouched. Rollback tag `prod-pre-phase17-workflow → 87d4dc6`.
- **Intentionally deferred:** direct catalog-Product create/edit (products are created by the editorial
  approval of a request — the platform's safety model); team invites; billing; custom domains; email provider.

### Phase 16 follow-up — workspace console sidebar footer cleanup (UI-only, app-only deploy)
The `/app` sidebar footer now contains **Sign out only**. Removed the operator/utility footer links
(View public site, Editorial standards, Platform admin, ETK editorial console, Payload CMS). Routes + gates
for `/platform`, `/dashboard`, `/admin` are **unchanged** — they're simply no longer promoted in the
workspace console. Verified (temp owner, created→checked→deleted): `/app` footer = Sign out only; **zero**
`/platform` / `/dashboard` / `/admin` / `/admin/collections` links anywhere in `/app`; all workspace nav +
10 sub-pages still 200; gates intact (`/admin` denied, `/platform`+`/dashboard` → 307 `/app`). Integrity
unchanged. Rollback tag `prod-pre-phase16-navfooter → 5099e37`. (The page-header "View public site" / "Add a
product" workspace actions remain — they are top-of-page actions, not footer launcher links.)

### Phase 16 — Workspace Console UX consolidation + tenant-safe nav (no migration, app-only deploy)
`/app` is now the **real customer workspace dashboard**, inheriting the premium `/dashboard` UX but fully
tenant/workspace-scoped. No schema/business-logic change.
- **Data layer `lib/workspace.ts`:** `requireWorkspace` + server-derived tenant+workspace scoping
  (`wsCount`/`wsList`/`workspaceDashboard`). A member with no resolvable tenant matches **nothing** (never
  leaks ETK/global data). `getTenantContext` wrapped in React `cache()` (dedupe layout+page).
- **`/app` dashboard:** header (Welcome + workspace + role + plan), scoped overview cards, trial card,
  needs-attention (warn/all-clear), editorial pipeline (informational), recent activity, integrated onboarding.
- **New workspace-safe pages:** `/app/{articles,products,categories,product-requests,analytics,newsletter,
  contact,media,editorial,settings}` — scoped lists, honest empty states, "setup in progress" panels for
  self-serve actions not yet wired. **No page links to `/admin/collections/...`.**
- **Sidebar redesign** (Overview / Content / Workflow / Growth / Workspace) → all links under `/app`.
  Platform admin, ETK editorial console, and Payload CMS links are shown **only to platform_super_admin**.
- **Gates unchanged & re-verified:** `/admin` denied to workspace users; `/platform` + `/dashboard` →
  **307 `/app`** for non-super; super-admin paths untouched.
- **Verified (temp owner, created→checked→deleted):** all 11 `/app/*` pages return **200 with no
  Unauthorized screen and zero `/admin/collections` links**; no ETK data leak; non-super sidebar hides
  admin/platform links; integrity unchanged (articles 5 / published 3 / runs 5 / media 45; fingerprints
  stable); jobs/locks/long-tx 0; worker untouched. (Note: prod now has ETK + 1 operator-retained browser
  test workspace = 2 tenants, intentionally kept.)
Rollback tag `prod-pre-phase16-console → af1c14c`.

### Phase 15 follow-up — public signup OPENED in production (no migration, app-only deploy)
Public signup is now **live**: `PUBLIC_SIGNUP_ENABLED=true` (+`FREE_TRIAL_DAYS=14`, `DEFAULT_WORKSPACE_PLAN=trial`,
`REQUIRE_EMAIL_VERIFICATION=false`) appended to `/opt/exploringtoknow/env/.env` and the app recreated to load it.
`/signup` shows the real form (no early-access state); header/drawer/footer CTA now reads **Start Free Trial**.
Two auth bugs found-and-fixed while verifying the authenticated happy-path (which prior phases never exercised):
1. **Real session login** — Payload v3 uses server-side sessions; a manually-set JWT cookie from `payload.login`
   is NOT accepted by Payload's cookie strategy. `/api/auth/login` + signup now delegate to Payload's own REST
   login over loopback and **forward its session `Set-Cookie`** (`lib/session.ts`).
2. **CSRF/Origin** — Payload rejects cookie auth without a trusted Origin/Referer; SSR navigations to `/app`
   often omit them. `getTenantContext` now presents our own first-party cookie to `payload.auth` with
   `Origin = serverURL` (safe: the server reads the visitor's own cookie).
**Verified live:** real signup → auto-login → **`/app` 200** (workspace owner sees Welcome + trial banner +
onboarding); non-super owner `/platform`+`/dashboard` → 307 `/app`; `/admin` denied; isolation suite 26/26;
3 test signups created (each 1 tenant/1 workspace/1 owner, trial) then **deleted** (ETK baseline restored,
0 residue); content unchanged (articles 5 / published 3 / runs 5 / media 45); dup-email → 409; jobs/locks 0.
Rollback tag `prod-pre-phase15fu2-opensignup → 682f05b`; backup `pre-opensignup_20260617_050151.sql.gz`.

### Phase 15 follow-up — public SaaS auth navigation (no migration, app-only deploy)
The public header/mobile-drawer/footer/hero now expose the SaaS flow alongside editorial nav:
**Log in** (`/login`) + a flag-aware primary CTA (**Start Free Trial** when `PUBLIC_SIGNUP_ENABLED=true`,
else **Request Access**, both → `/signup`); **My Workspace** (`/app`) when a session cookie is present;
**Request a Review** kept as secondary. Footer gained a **For businesses** column; the hero gained one calm
business line. Header auth state is a **presence-only** cookie check (UX only) — `/app`,`/platform`,`/admin`,
`/dashboard` gates remain server-side (verified: a fake cookie still 307s to `/login`). No schema/business/
generation/affiliate changes; rollback tag `prod-pre-phase15fu-nav → 3b84a6b`.

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
- **P15 — Public signup + workspace onboarding + free trial:** `/signup` + `/login` + `/api/auth/*` (Payload session cookie); transactional user+tenant+workspace+owner+trial creation (`lib/onboarding.ts`); trial fields; `/app` onboarding UX; `/platform` signup visibility; `/dashboard` gated to super admin; flag-gated, local-safe email, no billing/domains/AI. Migration 14→15. Public magazine unchanged.

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
| Production HEAD | **`main @ 618d98e`** (Blueprint v2 Phase 19 — workspace QA/owner polish) + docs |
| Local `main` HEAD | matches prod (clean) |
| Running app image | `etk-web@sha256:a66e921d…` (verified == freshly-built) |
| Public signup | **OPEN** — `PUBLIC_SIGNUP_ENABLED=true` in VPS env (FREE_TRIAL_DAYS=14, DEFAULT_WORKSPACE_PLAN=trial, REQUIRE_EMAIL_VERIFICATION=false) |
| Worker / Postgres / Caddy | **Unchanged** — not rebuilt/recreated (worker up 2d, Postgres/Caddy up 6d, 0 restarts) |
| App health | Healthy, freshly recreated (app-only, SKIP_MIGRATE) |
| Pending jobs / locks / long-tx | **0 / 0 / 0** |
| Payload migrations applied | **17** (latest `20260617_020000_phase19_billing`) |
| Billing provider | **local-safe** — `BILLING_ENABLED` off / no Stripe env (checkout/portal return disabled; webhook inert). ETK tenant = `comped` (unlimited). |

### Rollback points (prod tags)
`prod-pre-phase15-signup → 122b75c` · `prod-pre-phase14-isolation → 74d5fac` · `prod-pre-phase13-multitenant → 4359697` · `prod-pre-phase12b-native-admin → 19b68e3` · `prod-pre-phase12-admin-pro-redesign → 41d9308` · `prod-pre-phase11-author-analytics-merch → 9aef1e8` · `prod-pre-phase10-editorial-platform → adccd7c` · `prod-pre-phase8-editorial-growth → 2f17557` · `prod-pre-phase7-growth-ops → fa171df` ·
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
