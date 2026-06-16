# PROJECT_STATE.md

> Current snapshot. Updated 2026-06-15 after Phase 2 deployment & live verification.
> Documentation only — no production code, schema, worker, generation, publishing,
> category, approval, image-population, affiliate logic, or database data changed.

---

## Completed phases

**Phase 1 — Premium design system + homepage redesign: COMPLETE & DEPLOYED.**
Shared editorial design system (warm paper background, deep-forest brand, restrained
terracotta accent, serif display + sans body, tokens, cards, buttons, header/footer
foundation, responsive behavior) and the redesigned homepage.

**Phase 2 — Global navigation, native search, premium article experience: COMPLETE & DEPLOYED.**
- Scalable magazine navigation: server-rendered Topics mega menu driven by the real
  active categories, accessible mobile drawer (focus trap, scroll-lock, Escape, focus
  restore), desktop + mobile search entry points, single standardized **"Request a
  Review"** CTA across header/footer/homepage.
- Native, published-only server-side search (`/search`, `noindex`) over title /
  excerpt / slug / markdown / category name / product title using parameterized
  queries; published-only discovery listing routes `/buying-guides`, `/reviews`,
  `/explore`; sitemap updated.
- Premium article page: masthead (breadcrumb, category, deck, honest editorial byline,
  published/updated dates, reading time, framed hero + caption), in-article affiliate
  disclosure, reading-progress bar, stable-anchor collapsible Table of Contents with
  active-section highlight, refined body, restrained affiliate CTA (logic unchanged),
  "Continue Exploring" related with safe fallback, end-of-article actions.
- Responsive + accessibility **structural** checks and live route verification passed.

---

## Current production state (verified live)

| Item | Value |
|---|---|
| Production HEAD | **`main @ dcfb3bb`** (Phase 2 merge; fast-forwarded from Phase 1 `181e953`) |
| Local `main` HEAD | `dcfb3bb` (in sync with production) |
| Running app image | `etk-web@sha256:fc2672f9…` (only the app container was rebuilt/recreated) |
| Phase 2 rollback tag | `prod-pre-phase2-navsearch → 181e953` (local: `pre-phase2-navsearch → 181e953`) |
| Phase 1 rollback tag | `pre-ui-redesign → af7846a` (deeper rollback, still valid) |
| DB backup before deploy | `/opt/exploringtoknow/backups/pre-phase2_20260615_232148.sql.gz` (verified) |

> Note: `181e953` is the **Phase 1** production HEAD (pre-Phase-2). After the Phase 2
> deploy, production is at `dcfb3bb`. Roll back to Phase 1 via `181e953` (then rebuild
> the app container).

---

## Safety & integrity verification (Phase 2)

- **Business logic unchanged** — all changes confined to `apps/web/src`; collections,
  Payload config, packages, worker, migrations, Dockerfiles, compose, and
  `AffiliateCTA.tsx` were not modified.
- **No paid image API used.** Manual-image mode intact.
- **No Anthropic/OpenAI image-generation call used.** No generation triggered during
  deploy (`generation_runs` count unchanged; worker logs show no generate/force events).
- **Published-only gate intact** (`editorialStatus = 'published'`) across every public
  query and search; draft / ready_for_review / rejected never exposed (draft URLs 404).
- **Article integrity verified** — post-deploy content fingerprint (title/markdown/prose
  md5 for all published articles) matches the pre-deploy baseline exactly; no text
  rewritten; affiliate URLs and `rel="sponsored nofollow noopener"` preserved.
- **Worker, Postgres, and Caddy unaffected** — not rebuilt or recreated (worker Up 24h,
  Postgres/Caddy Up 5d, 0 restarts); only the app container changed.
- **Pending jobs = 0, ungranted locks = 0, long-running transactions = 0.** No restart
  loops; no app errors. App healthy on the new image.
- No duplicate articles or media (`articles=5`, `published=3`, `media=45` unchanged;
  no auto-publish).

---

## Known limitation

- **Browser pixel-level responsive testing still needs manual human review.** Phase 2
  responsive/accessibility were verified structurally (CSS breakpoints, fluid `clamp()`
  typography, ARIA/semantic HTML via live SSR, focus-management code) but not via
  headless-browser/screen-reader automation (unavailable in the build environment).
  Recommend a manual pass at 320 / 375 / 640 / 768 / 1024 / 1440px and a keyboard /
  screen-reader walkthrough of the mega menu and mobile drawer.

---

## Recommended next — Phase 3 candidates (NOT started)

1. Category page redesign.
2. Explore hub / topic discovery.
3. Request-product form polish.
4. Trending / Most-Read module.
5. Newsletter capture.
6. Author / About / Editorial Policy pages.
7. Optional PostgreSQL search index (GIN / `pg_trgm`) if content volume grows.
