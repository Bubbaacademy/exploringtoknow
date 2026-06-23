# PROVIDER_API_AUDIT.md

> **Phase 29 — Provider API Access Audit + Integration Blueprint Correction.**
> Research + architecture + documentation only. **No integration code, no OAuth, no migrations, no deploy, no external
> API calls, no app/account creation, no tokens/secrets.** Created 2026-06-20.

## 0. Purpose & strategic correction

ExploringToKnow is a **multi-tenant Owned Media + Social + Ads + Landing Page AI OS** — not a magazine builder.
Magazine/articles are **one** output layer alongside landing pages, social posts/calendar, ad campaigns/creatives,
performance measurement, optimization insights, and (the new strategic direction) **API-based provider integrations**
and later **controlled publishing/launching through provider APIs**.

**Measurement strategy correction (the reason for this phase):**
- The Phase 28 manual performance import is a **fallback / pre-API onboarding / formula-validation / CSV-support layer** —
  **not** the long-term source of truth.
- **API-synced provider data is the primary long-term measurement source** for ad/social performance.
- **Internal landing-page analytics (Phase 24)** remain first-party web analytics (real, but a different thing from
  platform ad metrics).
- **Every dashboard/number must be labeled by source:** `internal` (first-party), `api-synced` (provider + account),
  `manual`/`imported` (user-entered, unverified), or `calculated` (derived from any of the above).

## 1. Methodology & access limitation (read this first)

- **Sources are official provider developer documentation only** (Google, Meta, TikTok, LinkedIn, Pinterest, Microsoft,
  X, Snapchat, Amazon developer sites). No blogs/third-party summaries were used as factual basis.
- **Tooling note / limitation:** in this environment **WebSearch is available in the main session but was denied to
  non-interactive subagents**; `WebFetch` worked on known official URLs. Research was therefore performed in the main
  session via official-domain-restricted WebSearch plus direct WebFetch. Where a granular fact (e.g. an exact OAuth
  scope string, sandbox specifics, or a precise rate number) could **not** be confirmed from an official page in this
  pass, it is **explicitly flagged `⚠ CONFIRM`** below and must be re-verified against the cited official page before
  any implementation. **Nothing here is guessed from memory** for the audit conclusions.
- Provider policies (scopes, review gates, quotas, verification) **change frequently** — re-verify at implementation time.

---

## 2. Provider audits

### A. Google Ads API (covers YouTube/video ads)

- **Developer token — required: YES.** Tokens have three **access levels**: **Test Account Access** (test accounts
  only), **Basic Access** (test + production, 15,000 operations/day cap), **Standard Access** (test + production,
  unlimited for most services). You start at Test/Basic and apply to upgrade; Basic-access review uses the Google
  Cloud project's **brand verification** status (completing brand verification expedites review). Reviews take days→weeks.
- **OAuth — required: YES.** OAuth 2.0; single scope **`https://www.googleapis.com/auth/adwords`**. Desktop/web
  (3-legged) and **service-account** flows are both documented.
- **Account model:** **Manager accounts (MCC)** vs **advertiser/customer accounts**. The **`login-customer-id`** header
  specifies the root/authorizing account when accessing accounts via a manager (omittable for direct access).
- **Read/reporting:** **GAQL (Google Ads Query Language)** over `GoogleAdsService.SearchStream`/`Search`. Metrics include
  `metrics.impressions`, `metrics.clicks`, `metrics.cost_micros` (spend), CTR, average CPC/CPM, `metrics.conversions`,
  `metrics.conversions_value` (revenue), and ROAS-type fields; segmentable (e.g. by `conversion_action`, date).
- **Write:** YES — campaigns/ad groups/ads/assets can be created/mutated via the API (subject to access level + RMF
  "required minimum functionality" for higher tiers).
- **Conversions/revenue:** conversion **reporting** (read `conversions`/`all_conversions`, conversion value) and
  conversion **upload** (offline conversions / value) are supported.
- **YouTube/video:** managed **through the Google Ads API** (video campaigns; `YoutubeVideoAsset` queryable via GAQL).
- **Quotas/approval/sandbox:** rate/operation limits per access level (15k/day Basic; unlimited Standard); **test
  accounts/sandbox available immediately** for development without production approval. OAuth app verification applies
  for production/external users.
- **Safely implementable first:** **read-only reporting sync** against a **test account** (token at Test/Basic),
  single `adwords` scope. Prereqs: Google Cloud project + OAuth client + developer-token application; Basic Access
  (brand verification) for real production accounts.
- **Verdict:** OAuth ✅ · Token/dev-account ✅ (developer token) · App/brand review ✅ (for Basic+/production) ·
  Sandbox/test ✅ (test accounts) · Read ✅ · Write ✅ · **Complexity: Medium** (clean single scope + GAQL + real test
  accounts; MCC/login-customer-id and token-tier review add some friction).
- **Sources:** developers.google.com/google-ads/api/docs/api-policy/access-levels ·
  /api-policy/developer-token · /oauth/overview · /oauth/access-model · /rest/auth · /concepts/call-structure ·
  /query/overview · /fields/v22/metrics · /conversions/reporting · /best-practices/testing

### B. Meta Marketing API (Facebook + Instagram ads)

- **Developer app — required: YES** (Meta app via developers.facebook.com).
- **App Review + Business Verification — required: YES (conditional, and the main gate).** App Review is required for
  access to data you don't own/manage; **Business Verification is required for all apps requesting Advanced Access**.
  For ads you apply for **Standard Tier + `ads_read` + `ads_management`**. Apps run in **Development Mode** (own
  data/test only) vs **Live Mode**; access is **Standard** vs **Advanced**.
- **Read scope:** **`ads_read`** → **Ads Insights API** (performance: impressions, clicks, CTR, CPC, CPM, spend,
  actions/conversions, purchase `action_values`/ROAS — "nearly any metric in Ads Manager"). Reading campaigns/ad
  sets/ads/creatives uses the Graph API with `ads_read`.
- **Write scope:** **`ads_management`** → create/manage campaigns/ad sets/ads/creatives.
- **Account model:** ad accounts (`act_<id>`) under a **Business Manager**; tokens can be **user tokens** or
  **system-user tokens** (recommended for server-to-server/long-lived). Conversions/purchase value via
  `actions`/`action_values` and the related **Conversions API** (CAPI) for server events.
- **Quotas:** **Business Use Case (BUC) rate limits**; e.g. ~**100 QPS per app+ad-account**; `ads_management` hourly
  budget scales with tier (Standard tier ~100,000 vs Dev tier ~300, + 40×active ads). Real-time usage in response headers.
- **Sandbox/test:** **test ad accounts** exist for development; full production access requires App Review +
  Business Verification. `⚠ CONFIRM` exact current test-ad-account limits/flow against the authorization docs.
- **Safely implementable first:** **read-only Insights** with `ads_read` — but note it requires **Advanced Access →
  App Review + Business Verification** to read real client accounts. Development against own/test accounts can begin
  before full review.
- **Verdict:** OAuth ✅ · App Review + Business Verification ✅ (required for ads_read/ads_management Advanced Access) ·
  Dev app ✅ · Sandbox/test ✅ (test ad accounts) · Read ✅ · Write ✅ · **Complexity: High** (review + business
  verification + BUC limits + token/system-user model).
- **Sources:** developers.facebook.com/docs/marketing-api/get-started/authorization · /docs/marketing-api/insights/ ·
  /docs/permissions/ · /docs/marketing-api/overview/rate-limiting/ · /docs/marketing-api/guides/smb/system-user-access-token-handling/ ·
  /docs/marketing-api/conversions-api/

### C. TikTok Marketing API (TikTok for Business)

- **Developer app — required: YES** (register an app in the TikTok for Business / Marketing API developer portal).
- **OAuth — required: YES** (authorization-code → access token; advertiser/Business-Center authorization).
- **Account model:** **advertiser accounts** accessed via **Business Center**; the app is authorized against
  advertiser account(s).
- **Reporting:** a dedicated **Reporting** API for auction + reservation ads (customizable metrics — impressions,
  clicks, spend, conversions, etc.); **Integrated Reporting** patterns documented.
- **Write:** campaign / ad group / ad creation supported (Campaign/AdGroup/Ad endpoints), with creative/media handling.
- **Approval / sandbox:** app review/approval applies; **sandbox/test mode** and exact **scope strings + token
  lifetimes** are documented in the Authorization FAQ but **could not be fully extracted from search snippets in this
  pass** → `⚠ CONFIRM` exact scopes, sandbox availability, and token TTL/refresh against the official Authorization
  FAQ and Reporting pages before implementation.
- **Safely implementable first:** **read-only Reporting** against an authorized advertiser account once app +
  authorization are approved.
- **Verdict:** OAuth ✅ · App review ✅ (`⚠ CONFIRM` extent) · Dev app ✅ · Sandbox `⚠ CONFIRM` · Read ✅ · Write ✅ ·
  **Complexity: Medium–High** (`⚠` pending confirmation of scopes/sandbox/review).
- **Sources:** business-api.tiktok.com/portal/docs (Overview) · /portal/docs/marketing-api-authorization-faqs/v1.3 ·
  Reporting & Business Center doc sections (business-api.tiktok.com/portal/docs?id=…).

### D. LinkedIn Marketing API (Marketing Developer Platform)

- **Developer app — required: YES**, and the app must be associated with a **LinkedIn Page**.
- **MDP access — required & gated: YES.** Apply per-product under **Products** (add **Advertising API**); LinkedIn
  approves. **Two tiers:** **Development** (default — read unlimited owned accounts, **edit ≤5 mapped accounts**, create
  **1 API test ad account**) and **Standard** (unlimited; requires a **support ticket + video demo** + LinkedIn review).
  Restricted programs (Matched Audiences, Audience Insights, Media Planning, Company Intelligence) need extra
  qualification. Production partners undergo a **Technical Sign Off** demo.
- **OAuth scopes (3-legged member consent only; no client-credentials for marketing):** **`r_ads`** (read ad accounts),
  **`rw_ads`** (manage campaigns/creatives — write), **`r_ads_reporting`** (analytics). Member must also hold an
  ad-account role (VIEWER…ACCOUNT_BILLING_ADMIN).
- **Account model:** **Sponsored Account** (`urn:li:sponsoredAccount:{id}`); role-based authorization via
  `/adAccountUsers`; Dev tier requires manual account mapping (≤5 editable).
- **Read/Write:** full CRUD on **campaign groups / campaigns / creatives** (`POST/GET .../adAccounts/{id}/...`).
- **Ad Analytics API:** `GET /rest/adAnalytics` (scope `r_ads_reporting`); pivots CAMPAIGN/CAMPAIGN_GROUP/CREATIVE/
  ACCOUNT + demographics. Confirmed metrics: `impressions`, `clicks`, `costInLocalCurrency`/`spend`,
  `externalWebsiteConversions`, video/engagement metrics, revenue-attribution finder. **CTR/CPC/CPM and exact
  lead-count field names** live on the `ads-reporting-schema` page → `⚠ CONFIRM` (may need client-side computation).
  No pagination; ≤15,000 elements/response.
- **Sandbox/test:** **no full sandbox**; Dev tier = 1 API test account + ≤5 editable real accounts (live spend). Token
  Generator + Postman provided.
- **Safely implementable first:** **read-only** account hierarchy + `adAnalytics` reporting with `r_ads` +
  `r_ads_reporting` in Development tier.
- **Verdict:** OAuth ✅ (3-legged only) · MDP approval ✅ (+ Standard tier video demo / Technical Sign Off) · Dev app ✅ ·
  Sandbox ⚠ (partial: 1 test account, no real sandbox) · Read ✅ · Write ✅ (≤5 accounts in Dev) · **Complexity: High**
  (gated multi-tier approval, mandatory member consent + role checks, Rest.li protocol, no real sandbox).
- **Sources:** learn.microsoft.com/linkedin/marketing/ · /increasing-access · /getting-started · /quick-start ·
  /integrations/ads/getting-started · /integrations/ads/integration-requirements · /integrations/ads-reporting/getting-started ·
  /integrations/ads-reporting/ads-reporting · developer.linkedin.com/product-catalog/marketing ·
  *(not fetched / `⚠ CONFIRM`)* /integrations/ads-reporting/ads-reporting-schema.

### E. Pinterest API (v5 — Ads)

- **Developer app — required: YES** with **access tiers**: **Trial** (rate-limited per day/app; entities created are
  **Sandbox-only**, visible only to creator) → **Standard** (per-minute/user/app limits; requires prior Trial approval
  + Developer-Guidelines compliance). A **dedicated Sandbox** is documented (developer-tools/sandbox).
- **OAuth — required: YES.** **Authorization Code** grant (the only grant giving full API capability). Scopes are
  per-permission (e.g. ads/analytics/catalogs); the **exact `ads:read` / `ads:write` scope strings** were not fully
  confirmed from snippets in this pass → `⚠ CONFIRM` against the authentication/authorization page.
- **Account model:** token's `user_account` must be the ad account **Owner** or have a **Business Access** role
  (Admin / Analyst / Campaign Manager).
- **Reporting:** **Ads analytics/reporting** with **90+ metrics**; sync endpoints (`/ad_accounts/{id}/analytics`,
  targeting analytics) + **async report** creation for large pulls.
- **Write:** v5 supports managing campaigns / ad groups / ads (create + targeting).
- **Safely implementable first:** **read-only ad-account analytics** in Trial/Sandbox, then Standard for production scale.
- **Verdict:** OAuth ✅ · Access-tier approval ✅ (Trial→Standard) · Dev app ✅ · Sandbox ✅ (documented) · Read ✅ ·
  Write ✅ · **Complexity: Medium** (clean v5 REST + real sandbox; exact ad scopes `⚠ CONFIRM`; lower strategic priority).
- **Sources:** developers.pinterest.com/docs/getting-started/access-tiers/ · /docs/key-concepts/access-tiers/ ·
  /docs/getting-started/set-up-authentication-and-authorization/ · /docs/api/v5/oauth-token/ · /docs/developer-tools/sandbox/ ·
  /docs/api-features/ads-overview/ · /docs/api-features/ads-reporting/ · /docs/api/v5/ad_account-analytics/ · /docs/api/v5/analytics-create_report/

### F. Optional / future providers (brief "later?" verdicts)

- **Microsoft Advertising API (Bing Ads):** GA; needs a **developer token + user credentials**; a **universal sandbox
  token** (`BBD37VB98`) lets dev start immediately; reporting APIs available. **Verdict: later, but technically the
  lowest-friction pilot** (real sandbox token) if/when search-on-Bing volume matters. Source: learn.microsoft.com/advertising/guides/get-started.
- **Amazon Ads API:** GA; OAuth-based; eligibility via Amazon's developer portal; Sponsored Products/Brands/Display +
  DSP; reporting + management. **Verdict: later** (relevant for retail/Amazon-seller workspaces). Source: advertising.amazon.com/about-api · /API/docs.
- **X/Twitter Ads API:** Ads API access is "no additional cost to approved developers" but lives behind the broader
  **X API tiers** (enterprise is costly); apply via ads.x.com/help. **Verdict: later / low priority** (cost + approval
  friction). Source: developer.x.com/en/docs/x-ads-api/… · devcommunity.x.com.
- **Snapchat Marketing API:** open to all developers; OAuth app created via Ads Manager → Business Dashboard; Ads API +
  Conversions API. **Verdict: later** (niche audience for this product). Source: developers.snap.com/marketing-api/Ads-API/overview · businesshelp.snapchat.com/s/article/api-apply.

---

## 3. Implementation priority table (evidence-based)

| Provider | Read metrics? | Campaign write? | OAuth? | App review / business verification? | Dev account/token? | Sandbox / test? | Complexity | Order | Notes / blockers |
|---|---|---|---|---|---|---|---|---|---|
| **Google Ads** (+YouTube) | ✅ GAQL | ✅ | ✅ (`adwords`) | Brand verification for Basic+/prod (test access immediate) | ✅ developer token | ✅ **test accounts** | **Medium** | **1** | Cleanest first read-sync: single scope, real test accounts, rich reporting; MCC `login-customer-id`; token-tier review for prod. |
| **Meta Ads** (FB/IG) | ✅ Insights | ✅ | ✅ (`ads_read`/`ads_management`) | **YES — App Review + Business Verification (Advanced Access)** | ✅ Meta app | ✅ test ad accounts | **High** | **2** | Highest strategic value but the review/verification gate is the main blocker; BUC rate limits; system-user tokens. |
| **TikTok Ads** | ✅ Reporting | ✅ | ✅ | ✅ app review (`⚠` extent) | ✅ | `⚠ CONFIRM` | **Medium–High** | **3** | Confirm exact scopes/sandbox/token TTL in Authorization FAQ before build. |
| **LinkedIn Ads** | ✅ adAnalytics | ✅ (≤5 in Dev) | ✅ (3-legged only) | **YES — MDP approval; Standard tier needs video demo + Technical Sign Off** | ✅ (Page-linked app) | ⚠ partial (1 test acct, no real sandbox) | **High** | **4** | Member-consent-only; role checks; Rest.li quirks; CTR/CPC/CPM field names `⚠`. |
| **Pinterest Ads** | ✅ (90+ metrics) | ✅ | ✅ (auth code) | Trial→Standard access-tier approval | ✅ | ✅ **sandbox** | **Medium** | **5** | Real sandbox; lower strategic priority; exact ad scopes `⚠`. |
| **Microsoft Ads** (Bing) | ✅ | ✅ | ✅ | dev token (universal sandbox token exists) | ✅ | ✅ **universal sandbox token** | **Low–Medium** | later (easy pilot) | Lowest-friction dev start; lower volume for most workspaces. |
| **Amazon Ads** | ✅ | ✅ | ✅ | eligibility via portal | ✅ | ⚠ | Medium | later | Retail/Amazon-seller workspaces. |
| **X/Twitter Ads** | ✅ | ✅ | ✅ | approval + paid X API tiers | ✅ | ⚠ | High | later | Cost + approval friction. |
| **Snapchat Ads** | ✅ | ✅ | ✅ | open, business account | ✅ | ⚠ | Medium | later | Niche audience. |

## 4. Recommended first provider — Google Ads (read sync), with reasons

1. **Immediate developer access without production review:** developer tokens start at **Test Account Access** and
   **test accounts** are available for development now — we can build/validate read-sync before any approval.
2. **Single, simple OAuth scope** (`https://www.googleapis.com/auth/adwords`) vs Meta's review-gated `ads_read` or
   LinkedIn's gated MDP approval.
3. **Comprehensive, queryable reporting** (GAQL) covering exactly the metrics we already model manually
   (impressions/clicks/CTR/CPC/CPM/cost/conversions/conversion value/ROAS) → clean normalization into synced tables.
4. **Covers YouTube/video ads** through the same API → two channels for one integration.
5. **Lowest mismatch risk to our existing data model** (Phase 27 Ads Studio + Phase 28 metrics already use these fields).
- *Honest caveat:* production access to **real** client accounts needs **Basic Access** (brand verification) and OAuth
  app verification — so the path is **build+validate on test accounts first, then graduate to Basic Access**.

---

## 4b. Multi-tenant OAuth model (authoritative — how connections actually work)

ExploringToKnow is a **SaaS provider**, not a single-account tool. The connection model is:
- **Platform-level credentials, set ONCE by the ExploringToKnow operator** (env only, never customer-facing, never
  committed): the platform's **own** Google Cloud OAuth Web-app client (`GOOGLE_ADS_CLIENT_ID`/`_SECRET`/`_REDIRECT_URI`),
  the platform's **Google Ads developer token** (`GOOGLE_ADS_DEVELOPER_TOKEN`), and `PROVIDER_TOKEN_ENCRYPTION_KEY`. These
  are app/provider credentials for the whole SaaS — **not** tenant-specific and **never** shown to customers.
- **Per-workspace customer OAuth:** each workspace owner/admin clicks **Connect** in
  `/app/provider-connections/google_ads`, completes Google consent in **their own browser**, and the callback stores
  **that workspace's** encrypted access/refresh tokens in `provider-connections` (tenant/workspace-scoped). The customer
  then picks which of their accessible Google Ads accounts to sync. Sync runs **only** for that workspace/account.
- **Customers never** provide a Google client id/secret/developer token, never edit VPS env, and never share a single
  global account. Tokens never leak across tenants. If the platform credentials aren't set, customers simply see
  **"setup pending"** (not "set these env vars"). *(Verified in code: start route reads platform env only; OAuth state is
  workspace-scoped; callback stores per-workspace encrypted tokens; account discovery + sync are workspace-scoped; no
  customer-credential fields exist on any collection.)*

## 4c. Google Ads API — Basic Access / compliance review: prepared talking points

> Status: **Basic Access application SUBMITTED** (ticket acknowledged by the Google Ads API Compliance team, 2026-06-23).
> Real-account report sync is blocked by **`DEVELOPER_TOKEN_NOT_APPROVED`** until approval. Use these honest, accurate
> answers if Google sends follow-up questions. All claims match the shipped code — do not overstate.

- **Tool name / company:** ExploringToKnow — a multi-tenant marketing/owned-media SaaS. The Google Ads API is one
  optional, per-customer integration inside the product.
- **Primary use of the API (current):** **read-only reporting only.** We pull each connected customer's own campaign
  performance (GAQL `campaign` daily: impressions, clicks, cost_micros, conversions, conversions_value) via
  `GoogleAdsService.SearchStream`, plus `listAccessibleCustomers` and a `customer` read for account identity. We
  normalize these into the customer's workspace dashboard alongside their other (manual/first-party) marketing metrics.
- **Do you create/modify campaigns, budgets, or ads?** **No.** The integration calls **only** read endpoints
  (`listAccessibleCustomers`, `GoogleAdsService.SearchStream` / `Search`). There are **no mutate calls** anywhere in the
  codebase — no campaign creation, no budget changes, no status/bid changes, no recommendations applied.
- **OAuth model:** standard **3-legged OAuth** with **explicit end-user consent**. Each customer (a workspace owner/admin)
  authorizes **their own** Google Ads account in their browser; we request the single scope
  `https://www.googleapis.com/auth/adwords`. We are a SaaS provider with **one** OAuth client + **one** developer token;
  customers never receive or supply API credentials.
- **Token storage / security:** OAuth access + refresh tokens are **encrypted at rest (AES-256-GCM)** with a server-only
  key; they are **never** logged, returned in API responses, or shown in the UI. Tokens are **scoped per customer
  workspace** in a multi-tenant database with server-side tenant isolation (a workspace can only ever read its own
  connection/accounts/metrics; cross-tenant access is rejected). Disconnect clears the stored tokens.
- **Who can connect / manage:** only a workspace **owner/admin** (or the platform super-admin) can connect, disconnect, or
  run a sync; other roles are read-only. Sync is **manual** (a button), default last 30 days, capped at 90.
- **Data handling:** we store the customer's own returned metrics in their workspace, clearly labeled `api-synced`, kept
  separate from manual entries and first-party web analytics. No data is sold or shared across customers.
- **Scale / RMF:** initial use is modest, per-customer, manual reporting. We can describe required-minimum-functionality
  reporting coverage on request. We are not requesting Standard (unlimited) access at this stage.

## 5. Normalized provider connection architecture (DESIGN ONLY — not implemented)

> These models are a **future design** to be implemented only in later, separately-approved phases. **No code, no
> migration, no tables exist yet.** All are **tenant/workspace-scoped server-side**, mirroring every collection since
> Phase 13. Tokens are **encrypted at rest** and **never** returned to clients or logged.

- **`provider_connections`** — one row per (workspace × provider × connected login). Fields: tenant, workspace,
  provider (`google_ads`|`meta`|`tiktok`|`linkedin`|`pinterest`|…), displayName, status (`connected`|`disconnected`|
  `error`|`expired`|`needs_reauth`), **encrypted access/refresh token refs** (envelope-encrypted; KMS/secret store —
  never plaintext in DB), grantedScopes[], tokenExpiresAt, connectedBy (owner/admin), lastError, createdAt/updatedAt.
- **`provider_accounts`** — ad/business accounts reachable through a connection. Fields: connection ref, provider
  accountId (e.g. customer id / `act_<id>` / sponsoredAccount urn / advertiser id), name, currency, timezone,
  managerAccountId (MCC/login-customer-id where relevant), status, tenant/workspace.
- **`provider_sync_runs`** — one row per sync attempt. Fields: connection/account refs, syncType (`accounts`|
  `campaigns`|`insights_daily`|…), windowStart/windowEnd, status (`running`|`success`|`partial`|`failed`),
  rowsFetched/accepted/rejected, startedAt/finishedAt, errorSummary, tenant/workspace.
- **`synced_campaigns`** — normalized campaigns. Fields: account ref, provider campaignId, name, status, objective,
  budget (raw), **mapping → internal Ads Studio `ad-campaigns`** (optional), provider, tenant/workspace, raw JSON snapshot.
- **`synced_ad_groups`** (a.k.a. ad sets / campaign groups) — normalized; account/campaign refs, providerId, name,
  status, targeting summary, mapping, tenant/workspace.
- **`synced_ads`** / **`synced_creatives`** — normalized ad + creative entities; refs to synced_ad_groups; provider
  ids; **mapping → internal `ad-creatives`, Social Studio posts, Landing Pages, Products** where applicable; tenant/workspace.
- **`synced_performance_daily`** — the metrics warehouse grain: one row per (account/campaign/ad_group/ad × **UTC day**
  × provider). Fields: impressions, clicks, spend, conversions, conversion value/revenue, leads, plus provider-native
  extras as JSON; **source label = `api-synced`**, provider, accountId; refs to the synced entity; tenant/workspace.
  (Sits alongside `performance-entries` `manual`/`csv_paste` and `landing-page-views` `internal` — all distinguishable.)
- **`provider_errors` / `provider_audit_logs`** — structured logs of sync failures, auth errors, rate-limit hits, and
  every connect/disconnect/sync/write action (who, when, what, provider, account) for audit + failure handling.

**Cross-mapping summary:** synced entities map to internal Ads Studio campaigns/creatives, Social Studio posts, Landing
Pages, and Products by explicit, workspace-scoped references — never by trusting provider ids as internal ids. Manual,
internal, and API-synced performance remain in **separate tables with explicit source labels** so dashboards can always
say where a number came from.

---

## 6. Corrected API-first roadmap (replaces the prior "Phase 29 Optimization Engine" plan)

> Numbering may be adjusted, but the **strategic direction is API-first**. Optimization comes **after** real API data.

- **Phase 30 — Provider Connections Foundation / OAuth Vault. ✅ DONE (2026-06-20, prod HEAD `95ef624`, migrations 25).**
  Shipped `provider-connections` + `provider-sync-runs` collections, AES-256-GCM token vault
  (`PROVIDER_TOKEN_ENCRYPTION_KEY`; disabled when absent), provider registry, owner/admin connect/disconnect, and the
  `/app/provider-connections` status page — all tenant/workspace-scoped, foundation-only (no sync, no token exchange).
- **Phase 31 — Google Ads Read Sync v1. ✅ IMPLEMENTED & DEPLOYED (2026-06-20, prod HEAD `0cb27f5`, migrations 26;
  live blocked by missing operator credentials).** Shipped `provider-accounts` + `synced-performance-daily`, the
  read-only Google Ads path (live OAuth start/callback, `listAccessibleCustomers`, GAQL campaign-daily `searchStream`
  v20, normalized `api_synced` rows), owner/admin manual sync (default 30d/max 90d), and a source-labeled Performance
  section. **READ-ONLY — no campaign write.** Env-gated (`GOOGLE_ADS_*` + vault key); not yet activated in prod.
  Operator must set the Google Ads OAuth client + developer token + redirect URI + vault key to go live.
- **Phase 32 — Meta Ads Read Sync v1.** Connect Meta (if App Review + Business Verification allow); pull ad
  account/campaign/ad-set/ad **insights**; normalize.
- **Phase 33 — Unified Metrics Warehouse.** Unify Google + Meta + manual + internal landing analytics into one
  reporting layer with **source labels** (`api-synced` / `manual` / `internal` / `calculated`).
- **Phase 34 — API-Based Performance Dashboard.** Provider-synced dashboards; compare platforms / campaigns / creatives
  / landing pages / products.
- **Phase 35 — Rule-Based Optimization Engine.** Recommendations based **primarily on API-synced data**, manual data
  clearly labeled fallback. **Recommend-only; never auto-applied.**
- **Phase 36 — Controlled Campaign Publishing v1.** Create/push campaign **drafts** to providers via official APIs
  where allowed — **paused/draft only**, explicit user approval, **budget guardrails**, **kill switch**, audit log.
- **Phase 37 — Social Account Connections / Publishing Foundation.** OAuth for social accounts; read profile/page/
  account **identity** only; no auto-publish until approved.
- **Phase 38 — Controlled Social Publishing v1.** Publish **approved** social posts via official APIs where allowed;
  explicit approval + audit logs.

(TikTok / LinkedIn / Pinterest read-sync slot in after Google + Meta, provider-by-provider, each behind its own approval.)

---

## 7. Hard safety rules for all future provider/API work

1. **No provider API keys/secrets printed or committed.** Ever.
2. **OAuth tokens encrypted at rest** (envelope encryption / secret store); never returned to clients or logged.
3. **Owner/admin-only** connection management (connect/disconnect/reauth).
4. **Every provider connection is tenant/workspace-scoped** server-side (derived from membership, never client input).
5. **Read sync before any write/launch.** Write APIs start as **draft/paused only**.
6. **No campaign launch without explicit user confirmation.** **No budget spend without explicit confirmation.**
7. **No automatic optimization actions** until a future, separately-approved phase.
8. **All provider data labeled by source / provider / account.** Manual vs internal vs API-synced vs calculated
   remain **distinguishable** everywhere.
9. **All sync runs have logs + failure handling** (`provider_sync_runs` + `provider_errors`/`provider_audit_logs`).
10. **Respect provider quotas, review gates, business verification, and ToS** — provider-by-provider, read-only first.
11. **Kill switch + audit log** mandatory before any publishing/launch phase.

---

## 8. Remaining unknowns / approvals needed (before Phase 30+)

- **`⚠ CONFIRM` at implementation time** (re-verify against the cited official pages): TikTok exact scope strings +
  sandbox + token TTL; Pinterest exact `ads:read`/`ads:write` scope strings; LinkedIn CTR/CPC/CPM + lead-count field
  names (`ads-reporting-schema`); Meta current test-ad-account limits.
- **Business/operational prerequisites we do not yet have** (not code): a Google Cloud project + **Google Ads developer
  token** application; a **Meta app + Business verification + App Review** submission; LinkedIn **Page + Advertising
  API** approval; TikTok/Pinterest developer app registration. These require **real accounts and provider approvals**
  the user/operator must initiate — **not done in this phase.**
- **Encryption/secret-store decision** for the OAuth vault (KMS vs sealed secrets vs app-managed envelope key) — design
  decision for Phase 30.

## 9. What did NOT change in this phase

No production app behavior changed. No code/integration, no OAuth, no migrations, no deploy, no external API calls, no
app/account creation, no tokens/secrets, no email/billing. Phases 22–28 (Brand Kit, Landing Pages + analytics, Social
Studio + calendar/export, Ads Studio, manual Performance) and all gates/local-safe modes are untouched. The manual
performance layer (Phase 28) is **retained** and now correctly **documented as a fallback/onboarding/validation layer**.
