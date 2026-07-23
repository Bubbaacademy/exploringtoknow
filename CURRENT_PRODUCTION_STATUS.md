# CURRENT_PRODUCTION_STATUS.md

_Updated: 2026-07-23 — facts below verified live over SSH this session. Regenerate anytime with `infra/server/verify-app.sh`._

**Production HEAD: `1134b46` (`1134b46abb701a55bdbd71d1191424664c0801a7`) (Phase 2N — Remaining Public Magazine
Pages (Search + Author) — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:6b19eb6d…`) healthy; payload_migrations 26 (before=26 → after=26, `migrations up to date`,
**no new migration**).**
Phase 2N is a small **consistency + honesty** pass over the two remaining reader-facing public pages that earlier phases had
not touched — the **search results page** and the **author page** — bringing them to the same magazine standard as the
homepage/sections/articles. **Public presentation only — 2 code files** (`app/(site)/search/page.tsx`,
`app/(site)/author/[slug]/page.tsx`); no stored content changed, no article/count/image fabricated. **These pages already
worked — this is polish, not a bug fix.** **Four changes:** **(A) SEARCH — honest truncation.** `searchPublishedArticles`
page-limits results at `SEARCH_LIMIT` (24) but the page printed the **true total**, so a 30-match query would read "30
results" while showing only 24 cards. It now reads **"Showing first 24 of 30 results"** whenever `docs.length < total`, and
keeps the original "N results" wording otherwise. The query, limit, helper and fetch are **untouched** — `docs.length < total`
is the sole new signal. **Latent today** (~4 published articles, so no query yet exceeds 24), but correct as content grows;
the wording is confirmed present in the **running container's** `search/page.js`. **(B) AUTHOR — real published-count meta
line.** The masthead now carries an honest count from the already-fetched articles, rendered only when > 0 (a "0 guides" line
never shows), reusing the existing `.cat-masthead-meta` styling — **no new CSS**. Confirmed live on
`/author/exploringtoknow-editorial-team`: **"2 published guides · Independently researched, human-reviewed"** — a real count.
**(C) AUTHOR — OpenGraph + Twitter metadata**, mirroring the category-page pattern exactly (title/description/url/siteName,
og type `profile`, social image from the author's **OWN** avatar when set — **omitted entirely otherwise** rather than
substituting an unrelated image). Confirmed live: `og:type=profile` + `og:site_name` present, `twitter:card=summary` with
**no image** (this author has no avatar, so the image is correctly omitted — set one in Payload and it upgrades to
`summary_large_image`). **(D) AUTHOR — empty-state copy** aligned with the 2M/2K tone: drops the "Coming soon" eyebrow
("Published work" / "No guides published yet") and adds a second editorial link (Browse all topics). Copy only — no invented
status, no fake count. **Newsletter confirm/unsubscribe pages were inspected and deliberately left untouched** (already clean,
functional noindex utility pages — churning them would add risk without value); both still return 200. **NO schema,
migration, DB write, Payload collection, `/admin`, env, provider, credential, OAuth, token, Google Ads, Meta Ads, Caddy,
domain-routing, middleware, BubbaAffiliate gateway, ContactMessages, intake-API, sitemap, package/lockfile, or `/app` |
`/dashboard` change** — and **no `site.css` or `lib/public.ts` change** (`.cat-masthead-meta` reused; `total`/`docs`/
`articles.length` were all already available). **Delivery — FAST-FORWARD, not a PR merge** (as with 2H–2M): the validated
branch `phase-2n-public-remaining-pages` was fast-forwarded onto `main`, so **`1134b46` is an ordinary single-parent commit**
(`parents=8d150a6`) and there is **no PR-merge commit for Phase 2N**. ⚠️ **Pasted-hash note:** the deploy request carried a
one-character-short commit hash (`1134b46ab701…`, a dropped "b"); the deployed commit is the **git-verified** full hash
`1134b46abb701a55bdbd71d1191424664c0801a7` — resolved from the branch tip, not the paste. Delivered to the VPS by git bundle
over SSH (SHA256 matched both ends, `8174cb5d…`; `git bundle verify` passed), working tree fast-forwarded `82a8eb6 → 1134b46`
(verified ancestor, clean fast-forward — the FF also replayed the already-approved Phase 2M docs commit `8d150a6`,
`CURRENT_PRODUCTION_STATUS.md` only, zero code impact), deployed with the standard
`ROOT=/opt/exploringtoknow bash /opt/exploringtoknow/infra/server/deploy-app.sh` (**app-only**, no Caddy update, no full
`docker compose up`, no manual DB change). **Verified live:** build passed (`✓ Compiled successfully`; deployed image
`6b19eb6d`; stale-image guard passed and the **running image was confirmed byte-equal to `etk-web:latest`**); migrate ran as
an observable **no-op** (`migrations up to date`, before=26 → after=26); **only `etk-app` was recreated** (`--no-deps`,
`StartedAt 2026-07-23T01:55:47Z`) → **healthy**; **Postgres, worker and Caddy were NOT restarted** (all unchanged at
`StartedAt 2026-07-14T00:22:20Z`) and the **live Caddyfile hash was byte-identical** (`0f45cd67…`). **Live DB re-inspected:**
`payload_migrations` = **26**, `articles` still **39 columns**. `GET https://exploringtoknow.com/api/health` → **200**; Payload
**`/admin` → 200**; **homepage 200**; **`/search` 200**; **`/author/exploringtoknow-editorial-team` 200**; **both newsletter
confirm/unsubscribe pages 200** (untouched); **all eight section pages 200**; **`/categories` 200** and **`/category/appliances`
200**; `/login` **200**; `/app`, `/app/articles`, `/dashboard`, `/dashboard/content` all **307 → /login**; **`/reviews` still
308 → `/product-reviews`** and **`/explore` still 308 → `/explore-picks`**. `bubbaaffiliate.com/`, `/sellers`, `/creators` all
**200 (unchanged)** and `POST bubbaaffiliate.com/api/bubbaaffiliate/intake` → **400 on empty body** (still wired + validating).
**A forbidden-CTA scan across five public pages** (`/`, `/search`, `/author/…`, `/beauty-style`, `/categories`) **returned 0
hits** for every one of eleven terms; **no public `Log in` in the header** (`>Log in<` → **0**). **Confirmed in the RUNNING
container:** `search/page.js` contains "Showing first"; the author bundle contains `cat-masthead-meta` and "No guides published
yet" and the old "Coming soon" is **gone (0)**. Pre-deploy: isolated VPS/Linux **build-only** validation of `1134b46` passed
(throwaway image `etk-web:p2n-validate`, isolated bare-repo + `git archive` extraction to `/tmp`, real rebuild — `✓ Compiled
successfully in 43s`, type-checking + linting clean, **44/44 static pages**; search + author + both newsletter pages + all
eight sections compiled; author OG `profile`/`summary_large_image` and the meta line present; **all Phase 2K/2L/2M markers
intact** — `grid:has` ×3, `picks-strip:has` ×4, `secdir` ×17, `section-band` ×3, `excerptText`; both 308 rules and the
sitemap route intact; cleaned up; **production untouched throughout validation**). ⚠️ **Local typecheck remains unusable on the
Windows checkout** (pnpm `node_modules` cannot resolve `next`/`react`/`payload` types), so the **isolated VPS/Linux build is
the authoritative gate** — it was green.
**Operator browser visual check: PASSED.** Confirmed by the operator in Chrome against the deployed production site — the
public magazine layout reads clean, the search and author pages render correctly, the public header has no Log in link, and
Staff Login remains footer-only. This brings Phase 2N to the same sign-off standard as Phases 2H–2M.
⚠️ **Follow-up — a `[TEST]` article is still LIVE on the public homepage.** *"[TEST] FLANCCI LED Dimming Stickers"*
(slug `zzz-test-flancci-led-dimming-stickers`) is `Editorial status = Published` and rendering in the "Most read" block. The
operator has confirmed this and will **set it to Draft in Payload `/admin`** — deliberately NOT filtered in code, since hiding
genuinely-published content behind a hardcoded rule would be dishonest and would mask the same problem next time.
**Prior — `82a8eb6` (`82a8eb6a50c8c90926b963002530fd9e571a626d`) (Phase 2M — Public Magazine Visual
Polish — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:090f2cdf…`) healthy; payload_migrations 26 (before=26 → after=26, `migrations up to date`,
**no new migration**).**
Phase 2M is a small, targeted **public magazine visual-polish** pass on top of the Phase 2L front page — **public
presentation only, 6 code files**, no stored content changed and no article, count or image fabricated. **Four fixes:**
**(A) THE HOMEPAGE ASKED FOR YOUR EMAIL TWICE.** The newsletter was the **final** homepage block, rendering directly above
the Footer's own newsletter — two `type="email"` inputs back to back ("Practical buying advice, in your inbox" immediately
followed by "Get the newsletter"), confirmed in the pre-deploy HTML. It now sits **mid-page, above the section directory**,
so it can never be adjacent to the footer unit. **Proven live post-deploy by byte offset:** the mid-page newsletter
(byte 18065) and the footer newsletter (byte 24781) are now **6,716 bytes / 4 `<section>` elements apart**, with all eight
directory cards between them. Because the newsletter always renders, the Phase 2L `hasFeedAbove` padding guard became
**provably always true** and was **removed rather than left as dead logic that reads like a live condition**. **(B) EXCERPTS
TRUNCATED MID-WORD WITH NO ELLIPSIS.** Five call sites cut copy with a bare `String(x).slice(0, n)`, severing the final word
and appending nothing — the live homepage read **"…how they beat common DI"**. A new **pure** helper `excerptText(value, max)`
in `lib/public.ts` cuts back to the last space, strips dangling punctuation and appends a **single** ellipsis — and **only
when the text was actually shortened**, so a short excerpt is returned untouched with no trailing "…" implying words that
were never there (it collapses whitespace and falls back to a hard cut for one unbroken token). Applied at all five sites
(`ArticleCard`, `MagazineSection` feature, `explore-picks` cover, homepage cover). **Unit-tested against 8 cases** including
the live regression string, then **proven live:** `common DI<` → **0**, that excerpt now ends **"…beat common…"**, and the
homepage carries exactly **2** ellipses — only on the genuinely-truncated excerpts, none on short copy. **(C) NO VISUAL
RHYTHM.** After the hero the homepage was one uniform run of sections on the same paper background. The closing "How every
guide is made" trust block now sits on a **tinted full-bleed band** (`.section-band`) with hairline rules, so the page ends
on a deliberate note. **Scoped to the new class only — no existing `.section` rule is touched**, so article, category and
listing pages are byte-identical. **(D) DUPLICATE "COMING SOON".** The section empty panel showed the eyebrow "Coming soon"
directly above a heading ending "…are coming soon"; now one statement — **"In progress" / "{Section} is being written now"**
(copy only; the explanatory paragraph, chips and actions are unchanged). Verified live on `/tech`: `guides are coming soon` →
**0**, new copy present. **Two CSS bugs were caught and fixed during self-review BEFORE commit:** `.section-band + .site-footer`
could never match (the Footer is a sibling of `<main>`, not of the sections) and a `margin-top` on the band would have
stacked with the preceding section's bottom padding and doubled the gap — both removed. **Purely public presentation — 6 code
files** (`app/(site)/page.tsx`, `app/(site)/site.css`, `app/(site)/explore-picks/page.tsx`, `components/site/ArticleCard.tsx`,
`components/site/MagazineSection.tsx`, `lib/public.ts`). **`site.css` and `lib/public.ts` are both purely additive (0 deleted
lines)** — no existing rule or helper was modified. **NO schema, migration, DB write, Payload collection, `/admin`, env,
provider, credential, OAuth, token, Google Ads, Meta Ads, Caddy, domain-routing, middleware, BubbaAffiliate gateway,
ContactMessages, intake-API, sitemap, package/lockfile, or `/app` | `/dashboard` change.** **Delivery — FAST-FORWARD, not a
PR merge** (as with 2H–2L): the validated branch `phase-2m-public-magazine-visual-polish` was fast-forwarded onto `main`, so
**`82a8eb6` is an ordinary single-parent commit** (`parents=beb09f1`) and there is **no PR-merge commit for Phase 2M**.
Delivered to the VPS by git bundle over SSH (SHA256 matched both ends, `86115ce4…`; `git bundle verify` passed), working tree
fast-forwarded `689d296 → 82a8eb6` (verified ancestor, clean fast-forward — the FF also replayed the two already-approved
Phase 2L docs commits `765be87` + `beb09f1`, `CURRENT_PRODUCTION_STATUS.md` only, zero code impact), deployed with the
standard `ROOT=/opt/exploringtoknow bash /opt/exploringtoknow/infra/server/deploy-app.sh` (**app-only**, no Caddy update, no
full `docker compose up`, no manual DB change). **Verified live:** build passed (`✓ Compiled successfully`; deployed image
`090f2cdf`; stale-image guard passed and the **running image was confirmed byte-equal to `etk-web:latest`**); migrate ran as
an observable **no-op** (`migrations up to date`, before=26 → after=26); **only `etk-app` was recreated** (`--no-deps`,
`StartedAt 2026-07-22T22:52:16Z`) → **healthy**; **Postgres, worker and Caddy were NOT restarted** (all unchanged at
`StartedAt 2026-07-14T00:22:20Z`) and the **live Caddyfile hash was byte-identical** (`0f45cd67…`). **Live DB re-inspected:**
`payload_migrations` = **26**, `articles` still **39 columns**, `enum_articles_editorial_status` still
`draft,ready_for_review,published,rejected`. `GET https://exploringtoknow.com/api/health` → **200**; Payload **`/admin` →
200**; **homepage 200**; **all eight section pages 200**; **`/categories` 200**; **`/search` 200**; **two REAL article pages
200** and **two REAL `/category/[slug]` pages 200** (`appliances`, `baby-kids`) — slugs resolved from the **live sitemap**;
`/login` **200**; `/app`, `/app/articles`, `/dashboard`, `/dashboard/content` all **307 → /login**; **`/reviews` still 308 →
`/product-reviews`** and **`/explore` still 308 → `/explore-picks`**; **sitemap intact** (41 URLs, 8/8 sections, 23
`/category/*`, retired `/reviews` + `/explore` absent). `bubbaaffiliate.com/`, `/sellers`, `/creators`, `/pricing`,
`/how-it-works` all **200 (unchanged)** and `POST bubbaaffiliate.com/api/bubbaaffiliate/intake` → **400 on empty body** (still
wired + validating; `/sellers` seller wording intact — correct there). **A forbidden-CTA scan across six public pages** (`/`,
`/tech`, `/beauty-style`, `/categories`, `/explore-picks`, `/buying-guides`) **returned 0 hits** for every one of twelve
terms including "Request a Review", "Start Free Trial", "free trial", "Create workspace", "My Workspace", "BubbaAffiliate",
"content-commerce", "Submit Your Offer", "Become a Creator". **No public `Log in` in the header** (`>Log in<` → **0**) and
**Staff Login is footer-only** — proven by byte offset (`footer-staff` at 27180, after `<footer>` at 24678). Pre-deploy:
isolated VPS/Linux **build-only** validation of `82a8eb6` passed (throwaway image `etk-web:p2m-validate`, isolated bare-repo +
`git archive` extraction to `/tmp`, real rebuild — `✓ Compiled successfully in 45s`, type-checking + linting clean, **44/44
static pages**; all eight section pages + `[...slug]`, `category/[slug]`, `categories`, `search` compiled; `section-band` in
the built CSS, new empty-state copy present and old copy 0, `hasFeedAbove` 0; **all Phase 2K/2L markers intact** —
`grid:has` ×3, `picks-strip:has` ×4, `secdir` ×17, `hub-head-meta`, `article-kicker`; both 308 rules and the sitemap route
intact; `NewsletterSignup` confirmed still wired into both the homepage and layout client chunks; cleaned up; **production
untouched throughout validation**). ⚠️ **Local typecheck remains unusable on the Windows checkout** (the pnpm `node_modules`
there cannot resolve `next`/`react`/`payload` types), so the **isolated VPS/Linux build is the authoritative gate** — the
`excerptText` helper was additionally unit-tested locally under Node against 8 cases (all pass).
**Operator browser visual check: PASSED.** Confirmed by the operator in Chrome against the deployed production site: the
homepage now has **one** main newsletter sign-up mid-page rather than two adjacent email asks; the **footer newsletter is
visually separate**; the **"How every guide is made" trust band reads cleanly** and the spacing into the footer looks good;
the old repeated dashed placeholder panels are gone; **thin sections read "In progress"** rather than duplicate "coming soon";
**card excerpts look clean with no visible mid-word break**; the **public header has no Log in link**; **Staff Login remains
footer-only**; and the public magazine homepage looks visually acceptable. This brings Phase 2M to the same sign-off standard
as Phases 2H–2L.
⚠️ **Follow-up — a `[TEST]` article is still LIVE on the public homepage.** *"[TEST] FLANCCI LED Dimming Stickers — Do Tiny
Lights Wreck Sleep?"* (slug `zzz-test-flancci-led-dimming-stickers`) is published and currently rendering in the "Most read"
block. **This is a content/admin issue, to be fixed in Payload `/admin` by setting the article to Draft** — deliberately NOT
filtered in code, since hiding genuinely-published content behind a hardcoded rule would be dishonest and would mask the same
problem next time. (Also note the homepage now shows a real "Most read / What readers are reading" ranking, so first-party
analytics data has begun accumulating since Phase 2L.)
**Prior — `689d296` (`689d2968f0ede715c97d1851af51e97dd04b8c9a`) (Phase 2L — Public Homepage Magazine
Polish — DEPLOYED & VERIFIED LIVE).
Phase 2L turns the public homepage into the final magazine-style front page, now that article pages (2J) and section /
category pages (2K) are polished. **Public presentation only — 3 code files; no stored content changed, NO fabricated
articles and NO fabricated counts** (every number rendered derives from real published records).
**THE HEADLINE FIX — six consecutive "coming soon" placeholders on the front page.** The live homepage was scanned BEFORE
coding and rendered **ONE article card followed by SIX dashed `.mag-ph` panels**. The cause was structural, not cosmetic:
the page rendered a block for **all five `VERTICAL_SECTIONS` unconditionally**, each falling back to a placeholder banner,
plus a sixth for Buying Guides — while `cover` and `trending` dedupe against the **same** 40-document pool, so on today's
thin content (~3 published articles) every section bucket was **guaranteed empty**. The page read as unfinished rather than
sparse. Section blocks now render **only when they genuinely have articles**, and all eight magazine sections are presented
once, deliberately, in a new front-page **section directory**. Verified live post-deploy: **`mag-ph` → 0 and "are on the
way" → 0** in the served HTML (both were 6× before).
**The section directory (`.secdir`) shows all eight sections with REAL counts**, resolved three different honest ways:
**category** sections sum the published counts of their **own** active categories (from `listActiveCategoriesWithCounts()`,
exact — not inferred from the capped 40-doc pool); the two **listing** sections are counted by their real `Articles.type`
values via a new read-only `countPublishedByTypes()`; and **Explore Picks**, being curated across the whole magazine, uses
`countPublishedArticles()`. Sections with content sort first (**stable sort**, so the editorial order declared in
`MAGAZINE_SECTIONS` is preserved inside each group) and **every section always renders** — nothing is hidden. Empty ones say
**"In progress" once, inside a polished card**, instead of six dashed banners shouting across the page. **Explicit 4/2/1
columns rather than auto-fill**: eight cards divide evenly at every breakpoint, so the orphaned-track bug class fixed for
`.grid` in Phase 2K **cannot reappear here**. **Rendered live and cross-checked against reality:** Beauty & Style and
Explore Picks show **"3 published guides"** — Beauty & Style's 3 **matches `/beauty-style`'s own `hub-head-meta`** — and the
six "In progress" sections were **each fetched independently and genuinely render an `empty-panel` with no hub meta**, so
the labels are provably truthful, not asserted. (Buying Guides and Product Reviews read "In progress" because **no
published article currently carries their types** — correct behaviour, not a counting bug.)
**Three honesty fixes.** The trending heading now **states the ranking actually in use** — "Most read / What readers are
reading" **only** when `listMostReadArticles()` returned real first-party analytics, otherwise "Fresh off the desk / Latest
guides & reviews"; it previously always said **"Trending guides"** even when the ranking was pure recency. The cover-story
heading distinguishes a **genuinely featured** article ("The editors' pick") from merely the newest one ("The latest from
the desk"), replacing the fixed editorial claim "The story worth your time". **Topic chips lead with categories that
actually have published guides** and are capped at 14 — previously **all 23 active categories** rendered, ~19 of them dead
ends; this is **ordering only**, every active category still appears on `/categories`.
**Also:** hero states the magazine promise plainly with **reader-only CTAs** (Explore buying guides / Read product reviews /
Browse all topics — all real routes), kept to **two buttons plus one link** so the mobile CTA row never crowds; the cover
hero image loads at **high fetch priority** as the LCP element and degrades to an `aria-hidden` placeholder when absent; the
cover shows its **real** publication date when the record carries one; the Explore Picks strip requires **2+ picks** before
claiming a section; mobile ≤640px stacks the hero CTAs full-width and drops the directory to one column; homepage metadata
gains OpenGraph `siteName` and a **`summary`** Twitter card — **deliberately with no image**, since the front page has no
representative one and borrowing an unrelated article hero would misrepresent it.
**Purely public presentation — 3 code files** (`app/(site)/page.tsx`, `app/(site)/site.css`, `lib/public.ts`).
`site.css` is **purely additive (0 deleted lines)** and `lib/public.ts` gained **only** the two read-only counters above
(both `find({ limit: 0, depth: 0 })` mirrors of the existing `countPublishedInCategory`) — **no existing helper was
modified**. **NO schema, migration, DB write, Payload collection, `/admin`, env, provider, credential, OAuth, token, Google
Ads, Meta Ads, Caddy, domain-routing, middleware, BubbaAffiliate gateway, ContactMessages, intake-API, sitemap,
package/lockfile, or `/app` | `/dashboard` change.** **Delivery — FAST-FORWARD, not a PR merge** (as with 2H–2K): the
validated branch `phase-2l-public-homepage-magazine-polish` was fast-forwarded onto `main`, so **`689d296` is an ordinary
single-parent commit** (`parents=970920b`) and there is **no PR-merge commit for Phase 2L**. Delivered to the VPS by git
bundle over SSH (SHA256 matched both ends, `d05a484f…`; `git bundle verify` passed), working tree fast-forwarded
`8046095 → 689d296` (verified ancestor, clean fast-forward), deployed with the standard
`ROOT=/opt/exploringtoknow bash /opt/exploringtoknow/infra/server/deploy-app.sh` (**app-only**, no Caddy update, no full
`docker compose up`, no manual DB change). **Verified live:** build passed (`✓ Compiled successfully`; deployed image
`bd1aaabb`; stale-image guard passed and the **running image was confirmed byte-equal to `etk-web:latest`**); migrate ran as
an observable **no-op** (`migrations up to date`, before=26 → after=26); **only `etk-app` was recreated** (`--no-deps`,
`StartedAt 2026-07-22T03:22:34Z`) → **healthy**; **Postgres, worker and Caddy were NOT restarted** (all unchanged at
`StartedAt 2026-07-14T00:22:20Z`) and the **live Caddyfile hash was byte-identical** before and after. **Live DB
re-inspected:** `payload_migrations` = **26**, `articles` still **39 columns**, `enum_articles_editorial_status` still
`draft,ready_for_review,published,rejected`. `GET https://exploringtoknow.com/api/health` → **200**; Payload **`/admin` →
200**; **homepage 200**; **all eight section pages 200**; **`/categories` 200**; **two REAL article pages 200** and
**`/category/appliances` 200** — slugs resolved from the **live sitemap**, not assumed; `/login` **200**; `/app`,
`/app/articles`, `/dashboard`, `/dashboard/content` all **307 → /login**; **`/reviews` still 308 → `/product-reviews`** and
**`/explore` still 308 → `/explore-picks`**; **sitemap intact** (41 URLs, 8/8 sections, 23 `/category/*`, retired
`/reviews` + `/explore` absent). `bubbaaffiliate.com/`, `/sellers`, `/creators`, `/pricing`, `/how-it-works` all **200
(unchanged)** and `POST bubbaaffiliate.com/api/bubbaaffiliate/intake` → **400 on empty body** (still wired + validating).
**A forbidden-CTA scan of the LIVE homepage HTML returned count 0 for every one of:** "Request a Review", "Request Access",
"Start Free Trial", "Free Trial", "free trial", "Create workspace", "Create a workspace", "My Workspace", "BubbaAffiliate",
"seller", "creator", "content-commerce" — while the new UI ("Explore every section", "Inside the magazine", `secdir`,
"Explore buying guides", "Read product reviews", "Browse all topics") **was confirmed rendering in that live HTML**.
**No public `Log in` in the header** (`>Log in<` → **0**) and **Staff login is footer-only** — the single link sits inside
`</footer>` with class `footer-staff`.
⚠️ **This deploy also carried the already-committed Phase 2K docs state.** The VPS tree was at `8046095` (the 2K *feature*
commit) while `main` already had `970920b` (the 2K *docs* commit) on top, so the fast-forward replayed
`8046095 → 970920b → 689d296` and updated this file on the VPS to its already-committed 2K content. **Documentation only,
zero code impact.**
⚠️ **Caddy hash note for future readers:** this session measured `0f45cd6735536cbc15da33acfe0f5311` on the **live**
`/etc/caddy/Caddyfile` **inside the container**, whereas earlier entries record `707a062de883706bd14d7bb43808ff96` — the two
refer to **different paths** (live container file vs. the repo/status-doc artifact), **not** a config change. The live hash
was **byte-identical before and after** this deploy and Caddy was never restarted.
⚠️ **Dead-CSS note:** `.mag-ph` **remains defined in `site.css` but is now unused by any component** (the homepage was its
only consumer). It was left in place deliberately to keep `site.css` purely additive; **harmless — remove only in a future
cleanup phase.**
⚠️ **Local typecheck is NOT usable on the Windows checkout** and this will bite the next phase: the pnpm `node_modules`
there cannot resolve `next` / `react` / `payload` types, producing **6643 errors on the PRISTINE tree** before any edit
(6660 with Phase 2L — the +17 delta being purely additional JSX-element artifacts, **no new error class**). The
**authoritative gate is the isolated VPS/Linux build**, which was green. Pre-deploy: isolated VPS/Linux **build-only**
validation of `689d296` passed (throwaway image `etk-web:p2l-validate`, isolated bare-repo + `git archive` extraction to
`/tmp`, real rebuild — `✓ Compiled successfully in 43s`, type-checking + linting clean, **44/44 static pages**;
`next.config.ts` sets **no** `ignoreBuildErrors`/`ignoreDuringBuilds`, so the build is a **real** typecheck+lint gate; all
eight section pages + `[...slug]`, `category/[slug]`, `categories`, `search` compiled; all Phase 2L CSS present
(`secdir` ×17, `hero-link` ×3, `cover-meta` ×1) and **all Phase 2K quantity rules intact** (`grid:has` ×3,
`picks-strip:has` ×4); Phase 2J article markers and Phase 2K section markers confirmed still present (the latter in shared
chunk `9826.js`, since section routes are thin wrappers around `MagazineSectionPage`); both 308 rules and the sitemap route
intact; cleaned up; **production untouched throughout validation** — HEAD, image, all four container `StartedAt` and the
Caddy hash all re-verified unchanged).
**Operator browser visual check: PASSED.** Confirmed by the operator in a live browser against the deployed homepage and the
key public magazine routes: the **six dashed placeholder panels are gone**; the **section directory renders correctly with
real counts and "In progress" labels**; the public magazine layout reads clean; there is **no public `Log in` in the
header**; **Staff Login remains footer-only**; and the key public pages load correctly. This confirms in a real browser what
the post-deploy HTML scans asserted programmatically, and brings Phase 2L to the same sign-off standard as Phases 2H–2K.
**Prior — `8046095` (`8046095252d814d78e5913ff9378ff6feacfba09`) (Phase 2K — Public Section / Category Page
Polish — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:1e2016d3…`) healthy; payload_migrations 26 (before=26 → after=26, `migrations up to date`,
**no new migration**).**
Phase 2K polishes the **public section, category and listing experience** so it handles **sparse content** cleanly. **Public
UI only — no stored content changed, NO fabricated articles and NO fabricated counts** (every number rendered derives from
real published records). **Scope note:** as with 2J, these pages were already substantially built (per-section heros driven by
`lib/sections`, category masthead with description + honest count, grouped topic hub with real per-topic counts, styled
cards/chips/empty panels), so 2K is a **targeted polish pass, not a redesign**.
**THE HEADLINE FIX — orphan blank tracks on thin listings.** `.grid` used `repeat(auto-fill, minmax(290px, 1fr))`, and
**auto-fill KEEPS empty tracks**: with one or two published articles on a wide screen the cards sat orphaned in the first
track while the rest of the row stayed blank, reading as broken rather than sparse. **Quantity queries**
(`:has` + `:nth-last-child`) now give thin listings a deliberate shape — **1 article → a single 560px card, 2 → an even pair,
3 → a full row at ≥1024px** — while full grids are completely untouched. **`.picks-strip` (Explore Picks) had the identical
problem in the opposite direction:** its ≥900px layout is a fixed `repeat(5, 1fr)`, so three published picks left **two blank
columns**; it now matches the real count for 1–4 picks. This matters because **the magazine genuinely runs thin per section
today, so the sparse case is the COMMON case here, not an edge case.** Both changes are **progressive enhancement** —
browsers without `:has()` keep the previous auto-fill behaviour and nothing breaks — and **mobile (≤640px) is already a
single column and is deliberately unaffected**. **Section hero metadata line:** each section page now carries an honest meta
line under its description — the **real** published-guide count, the number of topics with content, and the standing
"Independently researched, human-reviewed" note — rendered **only when the section actually has articles** (a "0 guides" line
would be noise, and the empty state already covers that case). **`/categories` is cleaner and prioritises topics with
published guides:** within each editorial group, topics that actually have content now sort first so a browsing reader
reaches real guides before "Coming soon" placeholders — **ordering only; nothing is hidden and every active category still
appears**, still sourced from `listActiveCategoriesWithCounts()`. **`/category/[slug]` metadata remains safe:** it gains
OpenGraph + a Twitter card (matching what section pages already had), with the social image taken from the category's **own**
hero/image when set and **omitted entirely otherwise rather than substituting an unrelated image**. **Deliberately left
alone:** the category page body, section page structure, `ArticleCard`/`ArticleGrid`, `TopicChips`, prose typography and the
640px mobile rules — all already sound; churning them would add risk without value. **Purely public presentation — 4 code
files** (`app/(site)/site.css`, `components/site/MagazineSection.tsx`, `app/(site)/categories/page.tsx`,
`app/(site)/category/[slug]/page.tsx`); **NO schema, migration, DB write, Payload collection, env, provider, credential,
OAuth, token, Google Ads, Meta Ads, Caddy, domain-routing, middleware, BubbaAffiliate gateway, ContactMessages, intake-API,
sitemap, package/lockfile, or `/app` | `/dashboard` change.** **Delivery — FAST-FORWARD, not a PR merge** (as with Phases 2H,
2I and 2J): the validated branch `phase-2k-public-section-category-polish` was fast-forwarded onto `main`, so **`8046095` is
an ordinary single-parent commit** (`parents=dffb608`) and there is **no PR-merge commit for Phase 2K**. Delivered to the VPS
by git bundle over SSH (SHA256 matched both ends; `git bundle verify` passed), working tree fast-forwarded
`03a6ce1 → 8046095` (verified ancestor, clean fast-forward), deployed with the standard `infra/server/deploy-app.sh`
(**app-only**, no Caddy update, no full `docker compose up`, no manual DB change). **Verified live (19/19 checks passed,
nothing failed):** build passed (`✓ Compiled successfully`; deployed image `1e2016d3`; stale-image guard passed and the
**running image was confirmed byte-equal to `etk-web:latest`**); migrate ran as an observable **no-op**
(`migrations up to date`, before=26 → after=26); **only `etk-app` was recreated** (`--no-deps`, `StartedAt
2026-07-22T01:42:47Z`) → **healthy**; **Postgres, worker and Caddy were NOT restarted** (all unchanged at `StartedAt
2026-07-14T00:22:20Z`) and the **live Caddyfile hash was byte-identical** (`707a062de883706bd14d7bb43808ff96`). **Live DB
re-inspected:** `payload_migrations` = **26**, `articles` still **39 columns**, `enum_articles_editorial_status` still
`draft,ready_for_review,published,rejected`. `GET https://exploringtoknow.com/api/health` → **200**; Payload **`/admin` →
200**; **homepage 200**; **all eight section pages 200**; **`/categories` 200**; **four REAL `/category/[slug]` pages 200**
(`appliances`, `arts-crafts-hobbies`, `automotive`, `baby-kids`); **three REAL article pages 200** — category and article
slugs resolved from the **live sitemap**, not assumed; `/login` **200**; `/app`, `/app/articles`, `/dashboard`,
`/dashboard/content` all **307 → /login**; **`/reviews` still 308 → `/product-reviews`** and **`/explore` still 308 →
`/explore-picks`**; `bubbaaffiliate.com/`, `/sellers`, `/creators` all **200 (unchanged)** and `POST
bubbaaffiliate.com/api/bubbaaffiliate/intake` → **400 on empty body** (still wired + validating). **Confirmed in the RUNNING
container: all 7 quantity rules are live** in the served CSS (3 × `.grid`, 4 × `.picks-strip`). ⚠️ **Verification gotcha for
future readers:** the minifier rewrites `:nth-child(1)` to the semantically identical **`:first-child`**, and a naive grep
with `[^)]*` fails on the nested parens in `:nth-child(2)` — a first scan appeared to show missing rules that were in fact
present. **The fix is exercised on REAL data:** `/beauty-style` is currently the one populated section (2 grid cards), so the
`:nth-child(2)` rule applies there and produces an even pair instead of an orphaned card in a 4-track row; its hero meta line
reads **"3 published guides · 2 topics · Independently researched, human-reviewed"**, and the meta line is **correctly absent
on all eight empty sections** — designed behaviour proven live. **Sitemap intact:** 8/8 section URLs, 23 `/category/*` URLs,
`/categories` present, retired `/reviews` + `/explore` correctly **absent (0)**. **A forbidden-CTA scan across 7 public
listing pages** (`/`, `/categories`, `/beauty-style`, `/buying-guides`, `/product-reviews`, `/explore-picks`,
`/category/appliances`) **returned 0 hits** for every one of: "Request a Review", "Start Free Trial", "free trial", "Create
workspace", "My Workspace", "Request Access", "BubbaAffiliate", "seller", "creator". **Operator visual confirmation: PASSED.**
⚠️ **Latent-coverage note:** the **1-item grid rule** (`minmax(0, 560px)`) has **no live page exercising it today** — no
section currently holds exactly one article — so it is shipped and correct but **unobserved in production** until content
distribution changes (same situation as the Phase 2J caption fix). The **2-item rule IS live** on `/beauty-style`, so the
mechanism itself is proven working. Pre-deploy: isolated VPS/Linux **build-only** validation of `8046095` passed (throwaway
image `etk-web:p2k-validate`, isolated bare-repo + `git archive` extraction to `/tmp`, real rebuild — typecheck + lint +
`next build` green; all 27 `(site)` routes compiled including the eight sections, `/categories`, `/category` and the article
template; all 7 quantity rules, `.hub-head-meta`, category OpenGraph/Twitter present; both 308 rules and the sitemap route
intact; cleaned up; **production untouched throughout validation**).
**Prior — `03a6ce1` (`03a6ce165e64d0701a72520c48b8a69d51deaa4a`) (Phase 2J — Public Article Reading Experience
Polish — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:f501891f…`) healthy; payload_migrations 26 (before=26 → after=26, `migrations up to date`,
**no new migration**).**
Phase 2J polishes the **public article reading experience** on the ExploringToKnow magazine. **Presentation only — existing
article body rendering and stored content were NOT changed, no article text was generated, and no content was fabricated.**
**Scope note for future readers:** this page was already well built before 2J (breadcrumbs, category label, deck, byline with
conditional "Updated", hero + caption, TOC, conditional affiliate disclosure, related grid, newsletter; end-of-article CTAs
already cleaned in Phase 2F), so 2J is a **targeted polish pass, not a redesign** — the wins below are specific.
**A REAL LAYOUT BUG WAS FIXED.** `.article-hero` was declared **twice** in `site.css`; the later rule overrode only
`display`/`margin`/`padding`, so `aspect-ratio: 16/9` and `overflow: hidden` from the first declaration **still applied to the
`<figure>`** — which wraps both the 16:9 media box **and** the `<figcaption>`. The result: **any article with an image
caption had that caption clipped** by the figure's own overflow box. The stale declaration was removed (its
`.article-hero img` selector was already dead, since images had moved inside `.article-hero-media`) and a comment records why
the figure must not carry aspect-ratio/overflow. **Verified in the SERVED CSS post-deploy: `.article-hero{` now appears
exactly ONCE** (previously two conflicting declarations). **Article kicker is live:** the header gained a kicker row pairing
the **category link** with a new **article-type chip** ("Buying Guide", "Review", "Explainer", …), each omitted individually
when the record does not carry it. Type labels come from a new reader-facing `PUBLIC_ARTICLE_TYPE_LABEL` map in
`lib/sections.ts` (presentation only — the collection's `type` values are never modified). **Hero image** now loads
**eagerly at high priority with async decoding** (it is the page's largest paint element and was previously unhinted), and
the **no-image placeholder** is styled to read as intentional and marked `aria-hidden` since it carries no reader
information. **Reader navigation** back up to the magazine: the article's topic → the **listing its format belongs to**
(Product Reviews / Buying Guides, resolved via a new `listingForArticleType()` helper in `lib/sections.ts` so it can **never
point at a route that does not exist**, returning null and falling back rather than guessing) → Explore Picks. **Editorial
links only — no request, signup, workspace or promotional CTA.** **Related/continue-reading labelling is cleaner:** the
section previously announced itself to screen readers as "Related guides" while visibly displaying "Continue Exploring";
those now agree. **Metadata/OG/Twitter improvements are live:** OpenGraph gained `siteName`, `publishedTime`, `modifiedTime`,
`authors` and `section`, and a **Twitter card** was added using `summary_large_image` only when an image actually exists —
**every value read from fields already on the record; anything absent is omitted rather than invented.** **Deliberately left
alone:** prose typography (already 18px/1.78 on a 720px measure with a proper heading scale) and the 640px mobile rules
(padding, deck size, TOC collapse, full-width buttons already handled) — churning working CSS would add risk without value.
**Purely public presentation — 3 code files** (`app/(site)/[...slug]/page.tsx`, `app/(site)/site.css`, `lib/sections.ts`);
**NO schema, migration, DB write, Payload collection, `/admin`, env, provider, credential, OAuth, token, Google Ads, Meta Ads,
Caddy, domain-routing, middleware, BubbaAffiliate gateway, ContactMessages, intake-API, package/lockfile, or `/app` |
`/dashboard` change.** **Delivery — FAST-FORWARD, not a PR merge** (as with Phases 2H and 2I): the validated branch
`phase-2j-public-article-reading-polish` was fast-forwarded onto `main`, so **`03a6ce1` is an ordinary single-parent commit**
(`parents=2e4708c`) and there is **no PR-merge commit for Phase 2J**. Delivered to the VPS by git bundle over SSH (SHA256
matched both ends; `git bundle verify` passed), working tree fast-forwarded `11fa577 → 03a6ce1` (verified ancestor, clean
fast-forward), deployed with the standard `infra/server/deploy-app.sh` (**app-only**, no Caddy update, no full
`docker compose up`, no manual DB change). **Verified live (16/16 checks passed, nothing failed):** build passed
(`✓ Compiled successfully`; deployed image `f501891f`; stale-image guard passed and the **running image was confirmed
byte-equal to `etk-web:latest`**); migrate ran as an observable **no-op** (`migrations up to date`, before=26 → after=26);
**only `etk-app` was recreated** (`--no-deps`, `StartedAt 2026-07-21T21:18:40Z`) → **healthy**; **Postgres, worker and Caddy
were NOT restarted** (all unchanged at `StartedAt 2026-07-14T00:22:20Z`) and the **live Caddyfile hash was byte-identical**
(`707a062de883706bd14d7bb43808ff96`). **Live DB re-inspected to prove the schema is untouched:** `payload_migrations` = **26**,
`articles` table still **39 columns**, `enum_articles_editorial_status` still `draft,ready_for_review,published,rejected`.
`GET https://exploringtoknow.com/api/health` → **200**; Payload **`/admin` → 200**; **homepage 200**; **all eight public
magazine section pages 200**; **three REAL article pages 200** (slugs resolved from the live sitemap, not assumed); `/login`
**200**; `/app`, `/app/articles`, `/dashboard`, `/dashboard/content` all **307 → /login**; **`/reviews` still 308 →
`/product-reviews`** and **`/explore` still 308 → `/explore-picks`**; `bubbaaffiliate.com/`, `/sellers`, `/creators` all
**200 (unchanged)** and `POST bubbaaffiliate.com/api/bubbaaffiliate/intake` → **400 on empty body** (still wired +
validating). **Confirmed in the RUNNING container:** the kicker/category/type logic and `fetchPriority` are in the compiled
article bundle; `publishedTime`, `modifiedTime`, `summary_large_image` and `siteName` are present; `.article-kicker` and
`.article-type` are in the served CSS. **A live scan of a real article's HTML returned count 0 for every one of:** "Request a
Review", "Start Free Trial", "free trial", "Create workspace", "My Workspace", "Request Access", "BubbaAffiliate", "seller",
"creator" — while the new UI ("article-kicker", "article-type", "Continue Exploring", "Explore more guides") **was confirmed
rendering in that live HTML**. **Operator visual confirmation: PASSED.** **Caption-fix note:** the duplicate CSS rule is
provably gone from the served stylesheet, but whether any currently-published article actually sets `images.caption` was not
determinable remotely — if none do today, the fix is **latent-correct** and worth re-confirming the next time a captioned
article publishes. Pre-deploy: isolated VPS/Linux **build-only** validation of `03a6ce1` passed (throwaway image
`etk-web:p2j-validate`, isolated bare-repo + `git archive` extraction to `/tmp`, real rebuild — typecheck + lint +
`next build` green, confirming `fetchPriority` types cleanly on React 19.2; all 27 `(site)` routes compiled including the
article template and the eight section pages; all Phase 2J markers present and the duplicate hero rule already gone in the
built CSS; cleaned up; **production untouched throughout validation**).
**Prior — `11fa577` (`11fa57790ce766ca0d13a818dbc06b4b61e21dc8`) (Phase 2I — Payload CMS Editorial Editing
Polish — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:f394c374…`) healthy; payload_migrations 26 (before=26 → after=26, `migrations up to date`,
**no new migration**).**
Phase 2I improves the **real article editing surface — Payload `/admin`** — for ExploringToKnow magazine editors.
**Admin/CMS-only: `apps/web/src/collections/Articles.ts` is the ONLY code file changed** (plus this status doc). No schema,
no migration, no publishing-logic change: the `hooks` and `access` blocks are **byte-identical** to the prior version.
**Six presentational editorial sections** now organise the editor — *Publication control*, *Article identity*,
*Category & media*, *Content* (expanded) and *SEO & social*, *Internal & pipeline* (collapsed by default). **The publish gate
is now unmistakable**, which was the single most confusable thing in this collection (both `status` and `editorialStatus`
have a "published" option, but only one controls visibility): `editorialStatus` is relabelled **"Editorial status (controls
public visibility)"** with its four options stating their effect — **"Draft — not public"**, **"In review — not public"**,
**"Published — LIVE on the public magazine"**, **"Rejected — not public"** — while the AI field is relabelled **"Pipeline
status (NOT public visibility)"** and says plainly that "Published (pipeline)" does NOT mean the article is live. **No
"Archived" status was invented** — the collection has exactly those four. **Published-date behaviour is now documented
honestly:** the `beforeChange` hook stamps `editorialPublishedAt` on first publish but **never clears it**, so an article
moved back to Draft keeps a stale date; rather than change publishing behaviour in a polish phase, the field description now
states that a date there **does not by itself mean the article is public — only Editorial status decides that** (matching how
`/app/articles` and `/dashboard/content` already render it). Further guidance added: **slug** warns that changing it breaks
existing links and lists the **eight reserved magazine section slugs**; **article type** explains which public listing each
format feeds; **category** states it is required to publish; **hero alt text** is called out for accessibility; SEO/social
fields document their fallbacks; and **rich body blocks** explain they REPLACE the markdown source when non-empty.
`Categories` and `Media` collections were inspected and **deliberately left unchanged** to keep the schema-risk surface
minimal.
**WHY THIS IS SCHEMA-SAFE — verified, not assumed.** Fields are wrapped in Payload `collapsible` sections, which are
**presentational**: a collapsible has **no `name`**, so its subfields are stored flat on the parent exactly as if the wrapper
were absent. Static diff against the prior commit confirmed **58 field names, 28 select option values and 10 defaultValues
all IDENTICAL**, and every collapsible unnamed. The `editorialStatus` values in particular back the Postgres enum
`enum_articles_editorial_status` and are load-bearing for `PUBLISHED_WHERE` in `lib/public.ts` — only their **labels**
changed. **Empirical drift proof:** a throwaway Postgres on an isolated Docker network had **all 26 committed migrations
applied** (count verified 26), then Payload's migration generator was run twice under identical conditions — once against the
**prior deployed** `Articles.ts` and once against the **Phase 2I** version. Both emitted **877 lines**, and the statement
**sets are IDENTICAL**; the only raw-diff delta was the *emission order* of two `ADD COLUMN` statements (`publish_priority`
numeric, `editorial_notes` varchar) which moved because those fields were relocated between sections — same statements, same
types. The collapsibles produced **zero columns**. **Conclusion: Phase 2I contributes zero schema delta.** ⚠️ **Note for
future collection work:** the repo carries only **6 `.json` migration snapshots for 26 migrations** (newest `20260614`, twelve
behind), so a naive `payload migrate:create` diffs against a **stale baseline** and emits a large bogus migration for
unrelated collections — which is exactly why the differential method above was required. **Anyone changing a collection
should expect this and use a differential comparison, not a single generate.** Regenerating the snapshots deserves its own
phase.
**Delivery — FAST-FORWARD, not a PR merge** (as with Phase 2H): the validated branch
`phase-2i-payload-editorial-editing-polish` was fast-forwarded onto `main`, so **`11fa577` is an ordinary single-parent
commit** (`parents=b689d5d`) and there is **no PR-merge commit for Phase 2I**. Delivered to the VPS by git bundle over SSH
(SHA256 matched both ends; `git bundle verify` passed), working tree fast-forwarded `ee19ee9 → 11fa577` (verified ancestor,
clean fast-forward), deployed with the standard `infra/server/deploy-app.sh` (**app-only**, no Caddy update, no manual DB
change, no full `docker compose up`). **Verified live:** build passed (`✓ Compiled successfully`; deployed image
`f394c374`; stale-image guard passed and the **running image was confirmed byte-equal to `etk-web:latest`**); migrate ran as
an observable **no-op** (`migrations up to date`, before=26 → after=26); **only `etk-app` was recreated** (`--no-deps`,
`StartedAt 2026-07-21T20:05:29Z`) → **healthy**; **Postgres, worker and Caddy were NOT restarted** (all unchanged at
`StartedAt 2026-07-14T00:22:20Z`) and the **live Caddyfile hash was byte-identical** (`707a062de883706bd14d7bb43808ff96`).
**The LIVE DATABASE was inspected directly to prove the schema is untouched:** `payload_migrations` = **26**, the `articles`
table still has **39 columns**, and `enum_articles_editorial_status` still reads exactly
**`draft,ready_for_review,published,rejected`** — the enum backing public visibility is intact, so relabelling its options
changed nothing that `PUBLISHED_WHERE` depends on. `GET https://exploringtoknow.com/api/health` → **200**; Payload
**`/admin` → 200**; **homepage 200**; **all eight public magazine section pages 200**; `/search`, `/categories`, `/about`
**200**; **`/reviews` still 308 → `/product-reviews`** and **`/explore` still 308 → `/explore-picks`**; `/login` **200**;
`/app`, `/app/articles`, `/app/editorial`, `/dashboard`, `/dashboard/content` all **307 → /login**; `bubbaaffiliate.com/`,
`/sellers`, `/creators` all **200 (unchanged)** and `POST bubbaaffiliate.com/api/bubbaaffiliate/intake` → **400 on empty
body** (still wired + validating). **Confirmed inside the RUNNING container** (chunk `3608.js`): all six section labels plus
"Draft — not public", "Published — LIVE on the public magazine", "Pipeline status (NOT public visibility)" and the
published-date caveat. **Operator manual acceptance: PASSED** (signed-in Payload `/admin` review of the rendered editor).
**NO schema, migration, DB, env, provider, credential, OAuth, token, Google Ads, Meta Ads, Caddy, domain-routing, middleware,
public-routing, BubbaAffiliate gateway, ContactMessages, intake-API, package/lockfile, or `/app`-route change. No AI
generation, no auto-publish, no new approval automation.** Pre-deploy: isolated VPS/Linux **build-only** validation of
`11fa577` passed (throwaway image `etk-web:p2i-validate` + build-stage image for the drift probe, isolated bare-repo +
`git archive` extraction to `/tmp`, real rebuild — typecheck + lint + `next build` green), plus the throwaway-Postgres drift
proof above; **all throwaway resources torn down** (container, isolated network, both images, pulled `postgres:16-alpine`,
temp files) and **production untouched throughout validation**.
**Prior — `ee19ee9` (`ee19ee95d26716a01e6e44ea113aaa00f185b554`) (Phase 2H — ExploringToKnow Editorial Ops
Dashboard — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:f9d7a57b…`) healthy; payload_migrations 26 (before=26 → after=26, `migrations up to date`,
no new migration).**
Phase 2H replaces the `/dashboard/content` stub (*"Placeholder view. Implemented in a later phase."*) with a real
**ExploringToKnow Editorial Ops dashboard** — the operating overview for running the magazine. **It is deliberately NOT an
editor: Payload `/admin` remains the real editing path** for article body, SEO, images, categories and publication status,
and the page **never writes** (reads only, verified — no create/update/delete anywhere). **`/dashboard/content` is
super-admin gated** (the `/dashboard` layout enforces `requireSuperAdmin()` and marks the tree `noindex`) and **redirects
307 → /login when signed out** (verified live, as does `/dashboard` itself). **What the page shows:** a **publishing
overview** (Published, In review, Drafts, Rejected, Total articles, Categories, Media); a **"How publishing works"** panel
stating the rules plainly — **Draft → In review → Published**, only **Published** is public, publishing is **manual and
human-reviewed**, **AI may assist drafting but nothing publishes automatically**, and **Rejected** is the real fourth state;
**"Where work happens"** action cards linking to Payload **articles / categories / media**, the `/app` article desk, the
public homepage (new tab) and system health; a **"Recently edited"** queue of the 10 most recently edited articles (title +
slug, category, type, editorial status, **public state Live / Not public**, updated date, and published date **only when
truly published**); and an **"Operating surfaces"** reference map. **The surfaces panel is explicitly labelled a link map
that does NOT probe anything**, pointing at `/dashboard/health` for live checks — it never implies a health signal it did not
measure — and carries a note that **BubbaAffiliate is a separate product** managed outside ExploringToKnow editorial.
**Data sources are all existing and read-only:** `getAdminOverview()` for the counts it exposes; `client()` +
`payload.find({ limit: 0 })` for the **Rejected** and **Total** counts it does not; `payload.find(sort:'-updatedAt', depth:1)`
for the queue; and **`MAGAZINE_SECTIONS` from `lib/sections`** (Phase 2E) for the section route list, so the dashboard cannot
drift from the real public routes. **Shared editorial vocabulary consolidated:** the status/type labels and
`EditorialStatusBadge` / `PublicStateBadge` added in Phase 2G lived in `app/_ui.tsx`, but that file already imports from and
re-exports `dashboard/_components`; rather than duplicate them they now live in **`dashboard/_components`** (the shared
`.adm-*` design layer) and **`app/_ui.tsx` re-exports them** — the same idiom that file already uses for
Section/Stat/Card/Badge/StatusBadge. Single source of truth, correct dependency direction, and **byte-identical behaviour for
every existing `/app` consumer** (confirmed live post-deploy: `/app/articles` still carries "Editorial statuses", "Desk
overview", "Start an article request"; `/app/editorial` still carries "Create or review an article draft"). Also adds
**"Editorial Ops" to the dashboard Overview nav** — the route was previously unreachable except by direct URL. **Purely
internal dashboard — 4 files** (`dashboard/content/page.tsx`, `dashboard/_components.tsx`, `dashboard/layout.tsx`,
`app/_ui.tsx`); **no new collections, no new dependencies, zero CSS added** (reuses existing `.adm-*` classes); **NO schema,
migration, DB write, Payload collection, `/admin` customization, env, provider, credential, OAuth, token, Google Ads, Meta
Ads, Caddy, domain-routing, middleware, BubbaAffiliate gateway, ContactMessages, intake-API, or public-site change.**
**Delivery note — this deploy was a FAST-FORWARD, not a PR merge** (the first in this project): the validated branch
`phase-2h-etk-editorial-ops-dashboard` was fast-forwarded onto `main`, so **`ee19ee9` is an ordinary single-parent commit**
(`parents=143283a`) rather than a merge commit, and there is **no PR-merge commit for Phase 2H**. Delivered to the VPS by git
bundle over SSH (SHA256 matched both ends; `git bundle verify` passed), working tree fast-forwarded `b3ac495 → ee19ee9`
(verified ancestor, clean fast-forward), deployed with the standard `infra/server/deploy-app.sh` (**app-only**, no Caddy
update, no full `docker compose up`). **Verified live (19/19 checks passed, nothing failed):** build passed
(`✓ Compiled successfully`; deployed image `f9d7a57b`; stale-image guard passed — running == freshly built); migrate ran as an
observable **no-op** (`migrations up to date`, before=26 → after=26; live count independently confirmed **26**); **only
`etk-app` was recreated** (`--no-deps`, `StartedAt 2026-07-21T16:40:39Z`) → **healthy**; **Postgres, worker and Caddy were NOT
restarted** (all unchanged at `StartedAt 2026-07-14T00:22:20Z` — the `etk-postgres Running/Waiting/Healthy` lines in the
deploy log are the migrate step's dependency health-check, not a restart) and the **live Caddyfile hash was byte-identical**
(`707a062de883706bd14d7bb43808ff96`, no config change, no reload). `GET https://exploringtoknow.com/api/health` → **200**
`{"status":"ok","service":"web","missingEnv":[]}`; **`/dashboard` and `/dashboard/content` → 307 → /login**; Payload
**`/admin` → 200**; **homepage 200**; **all eight public magazine section pages 200**; `/login` **200**; `/app`,
`/app/articles`, `/app/editorial`, `/app/categories`, `/app/media` all **307 → /login**; `bubbaaffiliate.com/`, `/sellers`,
`/creators` all **200 (unchanged)** and `POST bubbaaffiliate.com/api/bubbaaffiliate/intake` → **400 on empty body** (still
wired + validating). **Confirmed inside the RUNNING container:** the old stub string `"Placeholder view"` → **0 (gone)**, and
`Editorial Ops`, `Publishing overview`, `How publishing works`, `Recently edited`, `Operating surfaces`, `nothing publishes
automatically` all present (`not the editor` ×2); the `PublicStateBadge` labels ("Not public") resolve from the **shared
chunks** (`7620.js`, `8455.js`) rather than the page bundle, as expected now that the vocabulary lives in
`dashboard/_components`. **Operator visual check: PASSED** (signed-in super-admin confirmation of the rendered dashboard).
**Real-data note:** production still has only ~3 published articles, so several stats read low (Rejected likely **0**) and
most "Recently edited" rows show **"—" under Published** with **"Not public"** — that is correct behaviour, not a regression.
Pre-deploy: isolated VPS/Linux **build-only** validation of `ee19ee9` passed (throwaway image `etk-web:p2h-validate`,
isolated bare-repo + `git archive` extraction to `/tmp`, real rebuild — typecheck + lint + `next build` green; **all 13
required assertions** met: `/dashboard` + `/dashboard/content` compiled, all four `/app` editorial routes compiled, all 27
`(site)` routes + eight section pages + `/login` compiled, public gateway + `/app/bubbaaffiliate` + `(payload)/admin`
compiled, both 308 rules intact, old stub gone and all new content markers present; cleaned up; **production untouched
throughout validation** — HEAD, image, container `StartedAt` and Caddy hash all unchanged).
**Prior — `b3ac495` (`b3ac495e7809698ce0e93808b698189b336346a9`) (Phase 2G-QA — ExploringToKnow Editorial Copy
Cleanup — DEPLOYED & VERIFIED LIVE).
App image `etk-web` (id `sha256:5c19ce6a…`) healthy; payload_migrations 26 (before=26 → after=26, `migrations up to date`,
no new migration).**
Phase 2G-QA was a **one-line internal editorial copy cleanup** — a QA follow-up to Phase 2G. The `/app/editorial` "Next:"
hint still carried stale seller-intake language, which is wrong for the ExploringToKnow magazine desk (an editorial workflow,
not a seller funnel). **Changed the `/app/editorial` fallback copy from `'Intake a seller offer to start the pipeline.'` to
`'Create or review an article draft in Payload /admin.'`** — pointing an editor at where article work actually starts,
consistent with Phase 2G's framing that article editing lives in Payload **/admin** while this console tracks the publishing
workflow. This is the **fallback branch** of `nextAction`, shown only when nothing is waiting (no pending requests **and** no
drafts in review); the other two branches are unchanged. **Purely copy — ONE string literal in ONE file**
(`apps/web/src/app/app/editorial/page.tsx`): no control flow, data fetching, query, routing, component, import, or styling
change; the conditional structure and every `wsCount`/`wsList` call are byte-identical. A full scan of the four ETK editorial
surfaces (`/app/articles`, `/app/editorial`, `/app/categories`, `/app/media`) for "seller offer", "seller submission",
"intake a seller", "submit your offer", "creator application", "BubbaAffiliate", "start free trial" and "request access" now
returns **clean**; the remaining `workspace` matches on those pages are **code identifiers** (`requireWorkspace`, `wsList`,
`ws.scope`), not user-visible copy, and were deliberately left alone since renaming them would be a functional change.
**`/app/bubbaaffiliate` was intentionally NOT touched** — it manages real seller submissions and creator applications, so its
seller/creator wording is correct there. **NO schema, migration, DB, Payload collection, `(payload)/admin`, env, provider,
credential, OAuth, token, Google Ads, Meta Ads, Caddy, domain-routing, middleware, BubbaAffiliate gateway, ContactMessages,
intake-API, or public-site change.** Merged to `main` via **PR #11** (`9f46497` under merge `b3ac495`). Delivered to the VPS
by git bundle over SSH (SHA256 matched both ends; `git bundle verify` passed), working tree fast-forwarded
`56bc9c1 → b3ac495` (verified ancestor, clean fast-forward), deployed with the standard `infra/server/deploy-app.sh`
(**app-only**). **Verified live:** build passed (`✓ Compiled successfully`; deployed image `5c19ce6a`; stale-image guard
passed — running == freshly built); migrate ran as an observable **no-op** (`migrations up to date`, before=26 → after=26;
live count independently confirmed **26**); **only `etk-app` was force-recreated** (`--no-deps`) → **healthy**; **Postgres,
worker and Caddy were NOT restarted** (unchanged `StartedAt 2026-07-14T00:22:20Z`) and the **live Caddyfile hash was
byte-identical** (`707a062de883706bd14d7bb43808ff96`, no config change, no reload). **Copy assertion made against the RUNNING
container artifact:** the old string `"Intake a seller offer to start the pipeline."` → **count 0 (GONE)**, the new string
`"Create or review an article draft in Payload /admin."` → **count 1 (LIVE)**, and a broader sweep of `editorial/page.js` for
`intake a seller` / `seller offer` / `seller submission` → **0 (clean)**. `GET https://exploringtoknow.com/api/health` → HTTP
200 `{"status":"ok","service":"web","missingEnv":[]}`; homepage, `/search`, `/categories`, `/login` **200**; **all eight
public section pages 200**; all six trust/legal pages (`/about`, `/editorial-policy`, `/affiliate-disclosure`, `/privacy`,
`/terms`, `/contact`) **200**; **`/reviews` still 308 → `/product-reviews`** and **`/explore` still 308 → `/explore-picks`**;
**`/app/editorial` remains auth-gated → 307 → /login when signed out**, as do `/app`, **`/app/articles`, `/app/categories`
and `/app/media`** (all deployed and working); Payload **`/admin` 200 — still the editing path**; `bubbaaffiliate.com/`,
`/sellers`, `/creators` all **200 (unchanged)** and `POST bubbaaffiliate.com/api/bubbaaffiliate/intake` → **400 on empty
body** (still wired + validating, not 404/500). **Visibility caveat:** because the changed string is the *nothing-pending*
fallback, a signed-in editor will **not** see it whenever a request is waiting or a draft is in review — the other two
branches render instead. The running-container grep above is the authoritative proof it deployed; a signed-in look only shows
which branch currently applies. Pre-deploy: isolated VPS/Linux **build-only** validation of `9f46497` passed (throwaway image
`etk-web:p2gqa-validate`, isolated bare-repo + `git archive` extraction to `/tmp`, real rebuild — typecheck + lint +
`next build` green; all four ETK editorial routes compiled, new copy present ×1 and old copy gone (0) in the compiled
`editorial/page.js`, all eight public section pages + `/login` compiled, both the public gateway and the internal
`/app/bubbaaffiliate` intake console compiled, both 308 rules intact; cleaned up; live app/DB untouched).
**Prior — `56bc9c1` (`56bc9c13e7d690bfae378cf1af979790291faf43`) (Phase 2G — ExploringToKnow Content Publishing
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
Production (VPS `/opt/exploringtoknow`, branch `main`) app code is at `1134b46` (Phase 2N remaining public magazine pages —
search + author; **fast-forwarded onto `main`, no PR-merge commit** — see the delivery note above; app-only build & deploy; no
migration, 26 → 26). Live Caddy config unchanged this deploy (still serves `bubbaaffiliate.com` + `www`; backup retained at
`/opt/exploringtoknow/caddy/Caddyfile.bak-20260714-050927`). GitHub origin
`Bubbaacademy/exploringtoknow` holds `main` @ `1134b46`; the VPS has no GitHub remote (updated via git bundle over SSH).
Rollback points: **before Phase 2N `82a8eb6`** (Phase 2M public magazine visual polish — app-only rollback, redeploy that
commit with `deploy-app.sh`; ⚠️ this reverts the search "Showing first N of M" honest-truncation wording and the author-page
published-count meta / OpenGraph / empty-state copy. Public-presentation only — no schema, data, or routing effect. Note
`8d150a6` — the Phase 2M docs commit and the immediate parent of `1134b46` — is **app-code-identical** to `82a8eb6`,
differing only in `CURRENT_PRODUCTION_STATUS.md`, so either commit restores the same running state);
**before Phase 2M `689d296`** (Phase 2L public homepage magazine polish — app-only rollback, redeploy that
commit with `deploy-app.sh`; ⚠️ this re-introduces the two visual defects 2M fixed — the homepage's back-to-back newsletter/
footer email asks and the mid-word excerpt truncation — and removes the trust-band visual rhythm and the "In progress"
empty-state copy. Public-presentation only — no schema, data, or routing effect. Note `765be87` and `beb09f1` — the Phase 2L
docs commits between `689d296` and `82a8eb6` — are **app-code-identical** to `689d296`, differing only in
`CURRENT_PRODUCTION_STATUS.md`, so any of the three restores the same running state);
**before Phase 2L `8046095`** (Phase 2K public section/category polish — app-only rollback, redeploy that commit with
`deploy-app.sh`; ⚠️ this reverts the homepage section directory and re-introduces the six dashed "coming soon" placeholders.
Public-presentation only — no schema, data, or routing effect. Note `970920b` — the Phase 2K docs commit and the immediate
parent of `689d296` — is **app-code-identical** to `8046095`, differing only in `CURRENT_PRODUCTION_STATUS.md`, so either
commit restores the same running state);
**before Phase 2K `03a6ce1`** (Phase 2J public article reading polish — app-only
rollback, redeploy that commit with `deploy-app.sh`; ⚠️ this restores `auto-fill` grid behaviour, so **orphaned blank tracks
return on thin listings** and Explore Picks again leaves blank columns; it also removes the section hero meta line, the
`/categories` content-first ordering, and category OpenGraph/Twitter metadata. Public-presentation only — no schema, data, or
routing effect. Note `dffb608` — the Phase 2J docs commit and the immediate parent of `8046095` — is **app-code-identical**
to `03a6ce1`, differing only in `CURRENT_PRODUCTION_STATUS.md`, so either commit restores the same running state);
**before Phase 2J `11fa577`** (Phase 2I Payload CMS editorial editing polish —
app-only rollback, redeploy that commit with `deploy-app.sh`; ⚠️ this reverts the public article header/hero/metadata **and
REINTRODUCES the duplicate `.article-hero` CSS rule that clips image captions**. Public-presentation only — no schema, data,
or routing effect. Note `2e4708c` — the Phase 2I docs commit and the immediate parent of `03a6ce1` — is **app-code-identical**
to `11fa577`, differing only in `CURRENT_PRODUCTION_STATUS.md`, so either commit restores the same running state);
**before Phase 2I `ee19ee9`** (Phase 2H Editorial Ops dashboard — app-only rollback,
redeploy that commit with `deploy-app.sh`; this restores the previous `Articles.ts` field layout and labels — **Payload-admin
UX only, no schema, data, or public-surface effect**. Note `b689d5d` — the Phase 2H docs commit and the immediate parent of
`11fa577` — is **app-code-identical** to `ee19ee9`, differing only in `CURRENT_PRODUCTION_STATUS.md`, so either commit
restores the same running state);
**before Phase 2H `b3ac495`** (Phase 2G-QA editorial copy cleanup — app-only
rollback, redeploy that commit with `deploy-app.sh`; this restores the `/dashboard/content` stub and moves the editorial
vocabulary back into `app/_ui.tsx` — internal-console only, no public-surface or schema effect. Note `143283a` — the
Phase 2G-QA docs commit, the immediate parent of `ee19ee9` — is **app-code-identical** to `b3ac495`, differing only in
`CURRENT_PRODUCTION_STATUS.md`, so either commit restores the same running state);
**before Phase 2G-QA `56bc9c1`** (Phase 2G content publishing workflow — app-only
rollback, redeploy that commit with `deploy-app.sh`; this restores the stale seller-offer string on `/app/editorial` —
cosmetic only, no functional impact);
**before Phase 2G `eabf8b3`** (Phase 2F deep public page polish — app-only rollback,
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
