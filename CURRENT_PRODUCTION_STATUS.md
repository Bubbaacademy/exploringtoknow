# CURRENT_PRODUCTION_STATUS.md

_Updated: 2026-07-20 — facts below verified live over SSH this session. Regenerate anytime with `infra/server/verify-app.sh`._

**Production HEAD: `56bc9c1` (`56bc9c13e7d690bfae378cf1af979790291faf43`) (Phase 2G — ExploringToKnow Content Publishing
Workflow Polish — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:510ffe19…`) healthy; payload_migrations 26 (before=26 → after=26, `migrations up to date`,
no new migration).**
Phase 2G improved the **internal `/app` editorial workflow surfaces** so the team can run ExploringToKnow as a magazine.
**Internal console UI/copy only — the public magazine is untouched by this phase.** **Updated `/app` routes deployed:**
`/app/articles`, `/app/editorial`, `/app/categories`, `/app/media` (all verified **307 → /login** when signed out).
**`/app/articles` now has clearer editorial columns:** **Title** (with the article **slug** on a second line), **Category**,
**Type**, **Editorial status**, **Public** (**Live / Not public**), **Updated**, and **Published** — plus a desk overview
(Published / In review / Drafts / Total, computed from rows already fetched, **no extra queries**) and a status legend.
Sorted by **newest edit** (`-updatedAt`) rather than creation date. **The old misleading Date-column behaviour was fixed:**
the table previously rendered a single "Date" column as `editorialPublishedAt || createdAt`, so an **unpublished draft
displayed its creation date under a column editors read as "published"**. Updated and Published are now **separate columns**,
and **Published shows "—" unless the article is truly published**. **Public state is derived from
`editorialStatus === 'published'`**, mirroring `PUBLISHED_WHERE` in `lib/public.ts` — the single public-visibility gate — so
the console and the public site can never disagree, and an editor never has to infer publication from a date. **Real
editorial statuses remain exactly four — `draft`, `ready_for_review`, `published`, `rejected` — and NO fake "Archived" status
was added** (it does not exist in the collection; the legend documents the real four and states that only **Published** is
public and a human sets it). New presentation-only label maps + `EditorialStatusBadge` / `PublicStateBadge` are **additive**
in `app/_ui.tsx`; the existing `StatusBadge` is unchanged and still used for product and generation-run states. **Copy
reframed from seller-intake to editorial:** the Articles action became **"Start an article request"** (same route
`/app/product-requests`, no behaviour change, **no seller/creator functionality added**); `/app/editorial` uses "In review",
the editorial badge, an "Open the article desk" link, and an empty state that no longer says "intake a seller offer";
`/app/categories` and `/app/media` helper copy now explains what the data means for publishing (a category is required to
publish, only **active** categories appear in public topic menus, alt text matters before an article goes live) and points at
Payload **/admin** for editing. **Article editing remains in Payload `/admin`** (verified live, HTTP 200) — **no new native
`/app` article editor was created**, and **`/dashboard/content` remains a stub** for a future phase. **Purely internal
console — 6 files** (`app/_ui.tsx`, `app/articles/page.tsx`, `app/editorial/page.tsx`, `app/categories/page.tsx`,
`app/media/page.tsx`, plus **one** added CSS rule `.adm-table .adm-cellsub` in the shared `.adm-*` design layer
`dashboard/dashboard.css`); **no new dependencies, no AI generation, no new approval system, NO Payload collection change, NO
`(payload)/admin` change**; **NO schema, migration, DB, env, provider, credential, OAuth, token, Google Ads, Meta Ads, Caddy,
domain-routing, middleware, BubbaAffiliate gateway, ContactMessages, intake-API, or public-site change.** Merged to `main` via
**PR #10** (`f43d3ed` under merge `56bc9c1`). Delivered to the VPS by git bundle over SSH (SHA256 matched both ends; `git
bundle verify` passed), working tree fast-forwarded `eabf8b3 → 56bc9c1` (verified ancestor, clean fast-forward), deployed with
the standard `infra/server/deploy-app.sh` (**app-only**). **Verified live:** build passed (`✓ Compiled successfully`; deployed
image `510ffe19`; stale-image guard passed — running == freshly built); migrate ran as an observable **no-op**
(`migrations up to date`, before=26 → after=26; live count independently confirmed **26**); **only `etk-app` was
force-recreated** (`--no-deps`) → **healthy**; **Postgres, worker and Caddy were NOT restarted** (unchanged `StartedAt
2026-07-14T00:22:20Z`) and the **live Caddyfile hash was byte-identical** (`707a062de883706bd14d7bb43808ff96`, no config
change, no reload); `GET https://exploringtoknow.com/api/health` → HTTP 200 `{"status":"ok","service":"web","missingEnv":[]}`;
**homepage 200**; **all eight public section pages 200**; **`/reviews` still 308 → `/product-reviews`** and **`/explore` still
308 → `/explore-picks`**; `/search`, `/categories`, `/login` 200; `/app` and all four editorial routes **307 → /login**;
Payload `/admin` **200**; `bubbaaffiliate.com/`, `/sellers`, `/creators` all **200 (unchanged)** and `POST
bubbaaffiliate.com/api/bubbaaffiliate/intake` → **400 on empty body** (still wired + validating, not 404/500). **The new logic
was confirmed inside the RUNNING container's compiled bundles** (not merely the built image): `articles/page.js` contains
"Editorial statuses", "Desk overview", "Start an article request", `adm-cellsub`; the shared chunks carry the
`PublicStateBadge` labels **"Not public"**, "In review", "Rejected"; the retired strings **"New seller submission"** and
**"Intake a seller offer"** are **gone (count 0)**; `.adm-cellsub` is present in the served CSS. **Verification caveat:**
`/app` is auth-gated, so these checks prove the code is **deployed** — the seven columns, Live/Not-public badges and slug line
should be confirmed with a **signed-in look** at `/app/articles` (same situation as the Phase 2B/3A sidebar fix). **Real-data
note:** production has only ~3 published articles, so most rows will show **"—" under Published** and **"Not public"** — that
is the corrected behaviour, not a regression (previously those rows showed a creation date that read as a publish date).
Pre-deploy: isolated VPS/Linux **build-only** validation of `f43d3ed` passed (throwaway image `etk-web:phase2g-validate`,
isolated bare-repo + `git archive` extraction to `/tmp`, real rebuild — typecheck + lint + `next build` green; all 19 `/app`
routes compiled including the four editorial ones, all 27 `(site)` routes and the eight public section pages compiled,
`/login`, `/bubbaaffiliate`, `/dashboard`, `/platform` compiled, both 308 rules intact in the built `routes-manifest.json`;
cleaned up; live app/DB untouched).
**Prior — `eabf8b3` (`eabf8b3d5d61652763bda27ab2a8ec31ab6c0d82`) (Phase 2F — ExploringToKnow Deep Public Page
Polish — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:65c8e1cb…`) healthy; payload_migrations 26 (before=26 → after=26, `migrations up to date`,
no new migration).**
Phase 2F polished the **remaining public ExploringToKnow deep pages** so the entire public site reads as **one consistent
editorial magazine** rather than a SaaS / workspace / seller / creator / business-intake site. **Public deep pages verified
live (all 200):** `/about`, `/editorial-policy`, `/affiliate-disclosure`, `/privacy`, `/terms`, `/contact`, a **real article
page** (`/tired-of-bra-lines-…`, forbidden-CTA count 0) and a **real category page** (`/category/appliances`). **The last
"Request a Review" CTAs were removed from the public magazine surface:** `/about` — the request block became **"How we choose
what to cover"** (editorial independence) with an **"Explore more guides"** link; `/editorial-policy` — corrections now route
to `/contact`, the intake-promoting "Reader requests" block became **"How coverage is decided"**, footer link **"Read more
buying guides"**; `/affiliate-disclosure` — "request a review" became **"contact us"**; **article pages** — end-of-article CTA
became **"Explore more guides"**; `/contact` + `ContactForm` — request-form pointers removed. The **`CTA` export in
`lib/nav.ts` was deleted outright** (zero consumers remain), so the public magazine now has **no call-to-action at all** —
only passive editorial links. **Two operational routes were demoted off the public magazine surface** (not deleted, not
broken): **`/request-product`** and **`/signup`** now carry **`robots: noindex, nofollow`** (verified live) and are **removed
from the sitemap** (verified: 0 occurrences each); both still return **200 at their direct URLs** and remain fully
functional — the intake path, `SignupForm` and the signup API are **UNCHANGED**. `/signup` had been **publicly crawlable with
a canonical URL** serving "content-commerce workspace" / "Free N-day trial" / "No credit card" / "Request early access"
marketing **inside the magazine chrome**; it is now noindexed and reframed as neutral account setup. `/login` — the "New here?
Create a workspace" link removed; **`/login` itself still works (200) and is `noindex, nofollow`**. **Homepage 200** and **all
eight magazine section pages still 200** (`/home-living`, `/beauty-style`, `/tech`, `/family-pets`, `/food-kitchen`,
`/buying-guides`, `/product-reviews`, `/explore-picks`); **`/reviews` still 308 → `/product-reviews`** and **`/explore` still
308 → `/explore-picks`**; `/search` and `/categories` 200; **`/app` → 307 → /login** (auth-gated); **Staff Login present
exactly once per page, footer-only and low-visibility**. **Live forbidden-CTA scan across 17 public pages returned count 0 for
every one of:** "Request a Review", "Request early access" / "Request Access", "Start Free Trial" / "free trial", "Create a
workspace" / "Create my workspace", "My Workspace", "content-commerce", "BubbaAffiliate", "Become a Creator", "Submit Your
Offer", and **public header Log in**. **Purely public copy/metadata — 11 files** (`about`, `editorial-policy`,
`affiliate-disclosure`, `[...slug]`, `contact`, `request-product`, `signup`, `sitemap.ts`, `ContactForm.tsx`,
`LoginForm.tsx`, `lib/nav.ts`); **zero CSS, no new dependencies, no new intake form, no new CTA, no fabricated content**;
**NO schema, migration, DB, env, provider, credential, OAuth, token, Google Ads, Meta Ads, Caddy, domain-routing,
middleware, BubbaAffiliate gateway, ContactMessages, intake-API, or `/app` change.** Merged to `main` via **PR #9**
(`c6c95e7` under merge `eabf8b3`). Delivered to the VPS by git bundle over SSH (SHA256 matched both ends; `git bundle verify`
passed), working tree fast-forwarded `aed2444 → eabf8b3` (verified ancestor, clean fast-forward), deployed with the standard
`infra/server/deploy-app.sh` (**app-only**, no `SKIP_MIGRATE`). **Verified live:** build passed (`✓ Compiled successfully`;
deployed image `65c8e1cb`; stale-image guard passed — running == freshly built); migrate ran as an observable **no-op**
(`migrations up to date`, before=26 → after=26; live count independently confirmed **26**); **only `etk-app` was
force-recreated** (`--no-deps`) → **healthy**; **Postgres, worker and Caddy were NOT restarted** (unchanged `StartedAt
2026-07-14T00:22:20Z`) and the **live Caddyfile hash was byte-identical before and after**
(`707a062de883706bd14d7bb43808ff96`, no config change, no reload); `GET https://exploringtoknow.com/api/health` → HTTP 200
`{"status":"ok","service":"web","missingEnv":[]}`; `bubbaaffiliate.com/`, `/sellers`, `/creators` all **200 (unchanged)**.
**Follow-up note:** if a stricter cleanup is wanted later, `/request-product` and `/signup` can be removed or moved to their
own non-magazine layout — they are currently **noindex/nofollow, unlinked and unpromoted**, reachable only by direct URL.
Two deliberate, approved carve-outs remain behind that noindex: `/request-product` still renders `<h1>Request a Review</h1>`
and `SignupForm` still shows a "Create my workspace" button — neither appears on any indexed magazine page (the 17-page live
scan is clean). Pre-deploy: isolated VPS/Linux **build-only** validation of `c6c95e7` passed (throwaway image
`etk-web:phase2f-validate`, isolated bare-repo + `git archive` extraction to `/tmp`, real rebuild — typecheck + lint +
`next build` green; all 27 `(site)` routes compiled, all 8 section pages present, both 308 rules confirmed in the built
`routes-manifest.json`, `index:!1` confirmed in the compiled `/signup` + `/request-product` bundles with `/about` correctly
still indexable, and compiled-bundle scans of `/about`, `/editorial-policy`, `/affiliate-disclosure`, `/contact` and
`[...slug]` returning 0 forbidden-string hits; cleaned up; live app/DB untouched).
**Prior — `aed2444` (`aed244476f44c23644e1b0023193140f3ed2df94`) (Phase 2E — ExploringToKnow Magazine Section
Pages — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:43fbcac3…`) healthy; payload_migrations 26 (→ after=26, `migrations up to date`, no new
migration).**
Phase 2E gives the public magazine **real editorial section pages**, so ExploringToKnow reads as a complete publication
rather than a homepage. **Eight public section routes, all verified 200 live:** `/home-living`, `/beauty-style`, `/tech`,
`/family-pets`, `/food-kitchen`, `/buying-guides`, `/product-reviews`, `/explore-picks`. **URL canonicalization:** the
previously live `/reviews` and `/explore` were renamed to their canonical public names and kept as **permanent 308
redirects** (`/reviews` → `/product-reviews`, `/explore` → `/explore-picks`, both verified live with `Location`) declared in
`apps/web/next.config.ts` — one canonical URL per section, existing links and search equity preserved. The two rules match
paths served only by the magazine; **`middleware.ts` (which owns host-aware gateway rewrites) was NOT touched** and the
`bubbaaffiliate.com` gateway exposes only `/`, `/sellers`, `/creators`, `/pricing`, `/how-it-works`, so gateway routing
cannot be affected. **Section mapping layer** (`apps/web/src/lib/sections.ts`): public section routes are stable,
human-readable URLs **deliberately decoupled from DB category slugs** (operational taxonomy that may change). Every
`categorySlugs` entry was verified against the **committed seed migration `20260614_214148`** (not guessed, no DB query);
every `types` entry is a real `Articles.type` option. Sections are exported as **named constants** so each route binds
statically — a typo is a compile error, not a render-time failure. Nav links point only at real app-router files, **never at
a raw category slug**, so a taxonomy change cannot 404 the nav. **Content reuse — no fabricated records:** verticals resolve
slugs → active categories → published articles via the new read-only helper `listPublishedArticlesBySectionCategories`
(published-gated, reuses `countPublishedInCategory`); listing sections reuse the existing `listPublishedArticlesByTypes`; a
missing/deactivated slug simply contributes nothing instead of throwing. **Thin sections degrade honestly** — a feature card
without a grid, or a "More {Section} guides are coming soon" panel explaining the human-review gate; topic chips only ever
show categories with `articleCount > 0`, so a chip never leads to an empty page. **Homepage + nav:** the homepage now
consumes the shared section map instead of its own duplicate copy (front page and section pages cannot drift), and "View all
→" opens the real section page rather than a raw `/category/<slug>` link; the Topics mega menu and mobile drawer gained a
magazine-sections row; the sitemap emits the canonical section URLs and **omits the retired paths** (verified live: all eight
present, `/reviews` and `/explore` absent). **Public CTA cleanup:** the **"Request a Review" CTA was removed** from the
magazine section and category pages. **Purely public UI / routing / copy — 22 files** (new `lib/sections.ts`,
`components/site/MagazineSection.tsx`, 7 section routes; modified `lib/public.ts`, `lib/nav.ts`, `SiteNav.tsx`, `sitemap.ts`,
`next.config.ts`, homepage, `category/[slug]`, + 4 link updates); **zero new CSS** (reuses existing site classes); **NO
schema, migration, DB, env, provider, credential, OAuth, token, Google Ads, Meta Ads, Caddy, domain-routing, middleware,
BubbaAffiliate gateway, ContactMessages, intake-API, or `/app` change.** Builds on the Phase 2D magazine front page
(`73b1238`, the immediate prior production HEAD). Merged to `main` via **PR #8** (`317b116` feature + `6fa63ad` typecheck fix,
under merge `aed2444`). Delivered to the VPS by git bundle over SSH (SHA256 matched both ends; `git bundle verify` passed),
working tree fast-forwarded `73b1238 → aed2444` (verified ancestor, clean fast-forward), deployed with the standard
`infra/server/deploy-app.sh` (**app-only**, no `SKIP_MIGRATE`). **Verified live:** build passed (deployed image `43fbcac3`;
stale-image guard passed — running == freshly built); migrate ran as an observable **no-op** (`migrations up to date`, 26);
**only `etk-app` was force-recreated** (`--no-deps`) → **healthy**; **Postgres, worker and Caddy were NOT restarted**
(unchanged `StartedAt 2026-07-14T00:22:20Z`) and the **live Caddyfile hash was byte-identical before and after**
(`707a062de883706bd14d7bb43808ff96`, no config change, no reload); `GET https://exploringtoknow.com/api/health` → HTTP 200
`{"status":"ok","service":"web","missingEnv":[]}`; homepage `/` → 200; **all eight section routes → 200**; both redirects →
**308** with correct `Location`; `/search` → 200; `/login` → 200; `/app` → **307 → /login** (auth-gated). **Public-surface
scan of the homepage + all eight section pages returned count 0 for every one of:** "Request a Review", "Start Free Trial",
"My Workspace", "content-commerce workspace", "BubbaAffiliate", "Become a Creator", "Submit Your Offer", "free trial";
**public header Log in count 0**; **Staff Login present low-visibility in the footer only**. `bubbaaffiliate.com/`,
`/sellers`, `/creators` all **200 (unchanged)**. **Content note:** production still has only ~3 published articles, so most
section pages currently render their **graceful "coming soon" placeholders** (verified on `/tech`) — the magazine structure
is fully live and sections fill in automatically as content is published. **⚠️ Slug reservation:** the static section routes
now **reserve the slugs** `tech`, `home-living`, `beauty-style`, `family-pets`, `food-kitchen`, `buying-guides`,
`product-reviews` and `explore-picks`. A published article using one of these exact slugs would be shadowed by its section
page (articles render at root-level `/{slug}` via the `[...slug]` catch-all, and static routes win). **Do not use these exact
slugs for article pages.** Pre-deploy: isolated VPS/Linux **build-only** validation passed (throwaway image
`etk-web:phase2e-validate`, isolated bare-repo + `git archive` extraction to `/tmp`, real rebuild — typecheck + lint +
`next build` green, all 8 routes and both 308 rules confirmed in the built `routes-manifest.json`, cleaned up; live app/DB
untouched). The **first validation build correctly FAILED** typecheck (`Property 'slug' does not exist` in `lib/public.ts` —
a chained `.map().sort()` inferring from Payload's narrowly-typed `find()` result), fixed in `6fa63ad` and re-validated green
— the same gate that caught the Phase 1C `noUncheckedIndexedAccess` error.
**Prior — `73b1238` (`73b1238dd53f16904ad29d9d85f990976cccdce5`) (Phase 2D — ExploringToKnow Magazine Front Page —
DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:5e14c2b6…`) healthy; payload_migrations 26 (before=26 → after=26, no new migration).**
Phase 2D rebuilds the **public ExploringToKnow homepage as an editorial magazine front page** (media/publishing layer;
`bubbaaffiliate.com` stays the separate business gateway, `/app` the internal operator/editorial console). **New homepage
sections**, all reusing existing article/category data via existing read helpers (no new data/schema): a stronger **editorial
hero** ("Explore smarter. Buy better. Know before you choose."), a **Cover Story** feature, a **Worth Reading Now / Trending**
grid, an **Explore Picks** editorial strip, six **magazine category sections** (Home & Living, Beauty & Style, Tech & Everyday
Gear, Family & Pets, Food & Kitchen, Buying Guides), a **Browse by category** chip cloud, a "how every guide is made" trust
block, and the **newsletter** signup. Articles are deduped across sections; thin sections show **graceful editorial
placeholders** (never fabricated content). Public **nav** gains a **Home** link and stays magazine/category-focused (Topics ·
Home · Buying Guides · Product Reviews · Explore Picks · Search). **Public SaaS/workspace/business CTAs remain removed** (no
Start Free Trial, no Request a Review, no "content-commerce workspace", no public Log in in the header); **Staff Login remains
low-visibility in the footer only**. `/login` and `/app` remain fully functional (auth-gated). **Purely public UI/copy/nav — 3
files (`apps/web/src/app/(site)/page.tsx`, `apps/web/src/app/(site)/site.css`, `apps/web/src/components/site/SiteNav.tsx`); NO
schema, migration, DB, env, provider, credential, OAuth, token, Google Ads, Meta Ads, Caddy/domain, BubbaAffiliate gateway,
ContactMessages, or intake-API change.** Builds on the Phase 2C public reposition (`f8aeefe`, the immediate prior production
HEAD). Merged to `main` via PR #7 (`8c4872d` under merge `73b1238`). Delivered to the VPS by git bundle over SSH
(SHA256-verified; `git bundle verify` passed), working tree fast-forwarded `f8aeefe → 73b1238`, deployed with the standard
`infra/server/deploy-app.sh` (**app-only**). **Verified live:** build passed (deployed image `5e14c2b6`; stale-image guard
passed — running == freshly built); migrate ran as an observable **no-op** (`migrations up to date`, 26 → 26); **only `etk-app`
was force-recreated** (`--no-deps`) → **healthy**; **worker/Postgres/Caddy were NOT restarted** (unchanged `StartedAt
2026-07-14T00:22:20Z`) and **no Caddy config changed**; `GET https://exploringtoknow.com/api/health` → HTTP 200; homepage `/`
→ 200 rendering the magazine front page (editorial hero, Cover Story, Worth Reading Now, all six category sections, Browse by
category verified in live HTML); header shows **Home** with **no public Log in** (count 0); Start Free Trial / Request a Review /
"content-commerce workspace" / My Workspace all **absent**; **Staff Login** present low-visibility in the footer; `/login` → 200
and `/app` → 307 → /login (auth-gated); `bubbaaffiliate.com/`, `/sellers`, `/creators` all **200 (unchanged)**. **Content note:**
production currently has only ~3 published articles, so the **Explore Picks** strip and the six category sections presently
render their **graceful placeholders** (the Cover Story + Trending grid consume the available articles) — these sections fill in
automatically as more content is published; the magazine structure is fully live. Pre-deploy: isolated VPS/Linux **build-only**
validation of `8c4872d` passed (throwaway image `etk-web:phase2d-validate`, isolated `git archive` extraction, real rebuild —
typecheck + lint + `next build` green, 44/44 static pages, cleaned up; live app/DB untouched).
**Prior — `a267905` (`a26790578f9b0b6bc2846e185db7fd8fea719190`) (Phase 2B/3A QA — Sidebar Active-State Fix + intake
empty-state copy — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:f26a4cf6…`) healthy; payload_migrations 26 (before=26 → after=26, no new migration).**
Small QA follow-up to the internal intake command center: the `/app` workspace sidebar now **highlights the nav item matching
the current route** (previously nothing was reliably active). The sidebar Links were extracted into a client component
(`apps/web/src/app/app/_nav.tsx` — `usePathname` + `aria-current="page"`) that marks active via a **longest segment-aware
prefix** match, so: **`/app/bubbaaffiliate` highlights Intake Overview**, **`/app/bubbaaffiliate/seller-submissions` (and its
`/[id]` detail) highlights Seller Submissions**, **`/app/bubbaaffiliate/creator-applications` (and its `/[id]` detail) highlights
Creator Applications** — while existing active behavior is preserved (`/app` → Command Center, `/app/ads` → Ads Studio,
`/app/performance` → Attribution & Reports, `/app/products` → Offers, and `/app/products` never false-matches
`/app/product-requests`). One CSS rule added for the active style (`.adm-nav a[aria-current="page"]` in `dashboard.css`).
**Empty-state copy lightly improved** (copy only): the seller-submissions empty state now mentions submissions come from
`bubbaaffiliate.com/sellers`, and the creator-applications empty state mentions applications come from
`bubbaaffiliate.com/creators`. **Purely UI/copy — 5 files (`_nav.tsx` new, `layout.tsx`, `dashboard.css`,
`bubbaaffiliate/_list.tsx`, plus this doc); NO schema, migration, DB, env, provider, credential, OAuth, token,
connection-record, Google Ads, Meta Ads, Caddy, public-gateway, or intake-API change.** Merged to `main` via PR #5 (`a1b0eb8`
under merge `a267905`). Delivered to the VPS by git bundle over SSH (SHA256-verified; `git bundle verify` passed), working tree
fast-forwarded `68575b2 → a267905`, deployed with the standard `infra/server/deploy-app.sh` (**app-only**). **Verified live:**
build passed (deployed image `f26a4cf6`; deploy script's stale-image guard passed — running == freshly built); migrate ran as an
observable **no-op** (`migrations up to date`, 26 → 26); **only `etk-app` was force-recreated** (`--no-deps`) → **healthy**;
**worker/Postgres/Caddy NOT restarted** (unchanged `StartedAt 2026-07-14T00:22:20Z`) and **no Caddy config changed**; `GET
https://exploringtoknow.com/api/health` → HTTP 200 `{"status":"ok","service":"web","missingEnv":[]}`; the three internal intake
routes load (auth-gated, `307 → /login` unauthenticated), and `/app/ads` + `/app/performance` still load. The corrected
active-state ships in the deployed image and is build-verified; the visible highlight renders client-side inside the
authenticated `/app` shell (confirm on sign-in). Pre-deploy: isolated VPS/Linux **build-only** validation of `a1b0eb8` passed
(throwaway image `etk-web:phase2b3a-sidebar-validate`, isolated `git archive` extraction, real rebuild — typecheck + lint +
`next build` green, cleaned up; live app/DB untouched).
**Prior — `68575b2` (`68575b290734e91e2fa333e2a41dbcb8dc8f4c6b`) (Phase 2B/3A — Internal BubbaAffiliate Intake
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
| Public site — https://exploringtoknow.com | UP (magazine front page + 8 section pages) |
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
Production (VPS `/opt/exploringtoknow`, branch `main`) app code is at `56bc9c1` (Phase 2G content publishing workflow merge,
PR #10; app-only build & deploy; no migration, 26 → 26). Live Caddy config unchanged this deploy (still serves
`bubbaaffiliate.com` + `www`; backup retained at `/opt/exploringtoknow/caddy/Caddyfile.bak-20260714-050927`). GitHub origin
`Bubbaacademy/exploringtoknow` holds `main` @ `56bc9c1`; the VPS has no GitHub remote (updated via git bundle over SSH).
Rollback points: **before Phase 2G `eabf8b3`** (prior production HEAD; Phase 2F deep public page polish — app-only rollback,
redeploy that commit with `deploy-app.sh`; internal-console-only revert, no public-surface effect);
**before Phase 2F `aed2444`** (Phase 2E magazine section pages — app-only rollback,
redeploy that commit with `deploy-app.sh`; note this also restores the public "Request a Review" CTAs on the trust/article
pages and un-noindexes `/request-product` + `/signup`);
before Phase 2E `73b1238` (Phase 2D magazine front page — app-only rollback, redeploy
that commit with `deploy-app.sh`; note this also restores `/reviews` + `/explore` as pages and removes the 308 redirects);
before Phase 2D `f8aeefe` (Phase 2C public-magazine reposition — app-only rollback,
redeploy that commit with `deploy-app.sh`); before Phase 2C `a267905` (Phase 2B/3A QA sidebar fix); before the sidebar fix
`68575b2` (Phase 2B/3A internal intake); before Phase 2B/3A `745d8a6` (Phase 1C — app-only rollback, redeploy that commit
with `deploy-app.sh`); before Phase 1C
`432c502` (Phase 1B/2A) — for a Caddy-only rollback, restore the `.bak-*` file and `caddy reload`; before Phase
1B/2A `2daa0f2` (Phase 1A); before Phase 1A `ace3cea`; before blocked-state fix `eb8e91b`; before Phase 33 `c7da882`; before
legal/brand `8fccef5`; before Phase 32 `2993976`. Worker fix baseline `c158c5f` unchanged. (Prod has ETK + 1 retained test
workspace + 1 customer workspace "testing" [tenant 22, which holds the live Google Ads connection]; ETK content unchanged.)
