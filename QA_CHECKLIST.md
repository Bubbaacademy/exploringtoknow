# Manual QA Checklist — post-Phase-4 human browser review

> Source of truth: PROJECT_STATE.md. Production: https://exploringtoknow.com
> Branch `main` @ `0bd96b1` · App image `etk-web@sha256:7209f7e0…`
> Read-only review. Do NOT approve product requests during QA (approval triggers real AI generation).
> Test viewports: 320, 375, 640, 768, 1024, 1440px. Also run a keyboard-only + screen-reader pass.

## 1. Homepage (`/`)
- [ ] Hero: clear visual hierarchy (eyebrow → headline → lede → CTAs); headline not oversized on mobile.
- [ ] Cover/featured story renders with image (or graceful placeholder).
- [ ] Latest articles grid: cards show image, category, title, excerpt, date; hover states feel subtle.
- [ ] Category chips render and link to `/category/<slug>`.
- [ ] Newsletter block (deep-forest band) renders; copy reads "Get practical buying guides…".
- [ ] Footer: 4 columns (Explore / Company / Get involved) + newsletter + disclosure; links work.
- [ ] Header nav: Topics mega menu opens (click + keyboard), all categories listed, "View all topics" works.
- [ ] Mobile: hamburger drawer opens, scroll locks, Escape closes, focus returns to button; no horizontal overflow.

## 2. Article page (one published article, e.g. `/bright-leds-ruining-your-sleep-a-simple-clean-fix`)
- [ ] Masthead: breadcrumb, category kicker, title, deck, "ExploringToKnow Editorial Team", date, reading time.
- [ ] Hero image renders with caption (if present); no overflow.
- [ ] Body readability: comfortable line length, paragraph rhythm, H2/H3 hierarchy.
- [ ] Inline images render, none duplicated, hero not repeated inline.
- [ ] Callout box(es) styled correctly.
- [ ] Affiliate CTA renders with product image/title; disclosure line present near top; links open in new tab.
- [ ] Reading-progress bar advances on scroll without layout shift; respects reduced-motion.
- [ ] Table of contents ("In this article"): links jump to correct headings; active section highlights; collapses on mobile.
- [ ] Related "Continue Exploring" excludes current article; cards link correctly.
- [ ] Article-end newsletter card renders.
- [ ] Mobile: no overflow on tables/images; CTA usable.
- [ ] Verify a 2nd published article + one with hero+inline images + one missing optional metadata.

## 3. Category / Explore / Search
- [ ] `/category/sleep-wellness`: masthead with count ("2 guides"), magazine grid, only published articles.
- [ ] A thin/empty category (e.g. `/category/tech-electronics`): elegant empty panel + other-topic chips (not blank).
- [ ] `/categories`: grouped topic hub, accurate counts or "Coming soon", scannable on mobile.
- [ ] `/explore`: cover + latest + browse-by-topic + Buying Guides/Reviews entry cards.
- [ ] `/search?q=led`: returns only published results; result count shown.
- [ ] Search with a draft-only term returns no draft; drafts never appear anywhere.
- [ ] `/buying-guides` and `/reviews`: premium empty states with topic navigation (intentional, not unfinished).
- [ ] Empty search + special characters + very long query: handled gracefully (no error page).

## 4. Request Product page (`/request-product`)
- [ ] Masthead with trust points; grouped fieldsets (Your details / Product / Category / Images).
- [ ] Required fields enforced (name, email, product name, product URL).
- [ ] Category is required; searchable combobox works with mouse AND keyboard (arrows/Enter/Escape).
- [ ] "Other / Not Sure" reveals and requires a suggested-category field.
- [ ] Image upload: accepts JPEG/PNG/WebP; enforces min 3 / max 30; shows count and "more needed".
- [ ] Image permission checkbox required and clearly explained.
- [ ] Anti-double-submit: button disables/shows "Submitting…"; cannot submit twice.
- [ ] On validation failure, entered values are preserved.
- [ ] Mobile: form is comfortable; combobox dropdown usable; touch targets adequate.
- [ ] NOTE: submitting creates a `submitted` request only — it does NOT publish or generate. Do not approve in admin during QA.

## 5. Newsletter
- [ ] Homepage signup: valid email → success message.
- [ ] Article-end signup: valid email → success.
- [ ] Footer signup: valid email → success.
- [ ] Invalid email → clear inline error, no submission.
- [ ] Duplicate email → friendly "already on the list" (no error).
- [ ] Honeypot: hidden "Company" field stays empty for humans; bots filling it get silent success, no row.
- [ ] Success/disabled states are accessible (status announced).

## 6. Static trust pages
- [ ] `/about` — mission (practical, no hype), how guides are made, independence, images, request a review.
- [ ] `/editorial-policy` — AI-assisted but human-reviewed, no auto-publish, independence, corrections.
- [ ] `/affiliate-disclosure` — commission at no extra cost, independence, link attributes, transparency.
- [ ] All three are linked from the footer and cross-link each other; readable on mobile.

## 7. Technical smoke checks (read-only)
- [ ] Routes return expected status: `200` for `/`, `/request-product`, `/about`, `/editorial-policy`,
      `/affiliate-disclosure`, `/categories`, `/category/sleep-wellness`, `/explore`, `/search`,
      `/buying-guides`, `/reviews`, `/sitemap.xml`, published article.
- [ ] Draft article URL returns `404`.
- [ ] `/api/health` returns `{"status":"ok"}`.
- [ ] `/search` is `noindex`; sitemap excludes it.
- [ ] No pending generation jobs (pgboss created/active/retry = 0).
- [ ] No ungranted DB locks; no long-running transactions.
- [ ] No generation triggered during QA; `generation_runs` count unchanged.
- [ ] No paid image API used (manual-image system only).
- [ ] Published article content unchanged (title/markdown fingerprints stable).

---

# Phase 5 additions — manual QA

Production `main` @ `6333011` · app image `etk-web@sha256:22a88b89…`. Routes verified `200` live; draft `404`.

## 8. Newsletter system
- [ ] Homepage / article-end / footer signup: valid email → success ("subscribed").
- [ ] Duplicate email → friendly "already on the list" (no error, no duplicate row).
- [ ] Invalid email → inline 422 error.
- [ ] Honeypot ("Company") filled → silent success, no row stored.
- [ ] `/newsletter/unsubscribe?token=bad` → friendly "link isn't valid" (no crash).
- [ ] `/newsletter/confirm?token=bad` → friendly "link isn't valid".
- [ ] Admin → Newsletter Subscribers shows email/status/source/provider/confirmedAt/createdAt.
- [ ] Local mode: new subscribers are `active` with provider `local` (no external email sent — expected until a provider is configured).

## 9. Contact page (`/contact`)
- [ ] Reasons grid renders; form has name (optional), email, reason, subject, product URL, message.
- [ ] Valid submit → success panel.
- [ ] Message < 10 chars or bad email → clear 422 error; values preserved.
- [ ] Honeypot → silent success, no row.
- [ ] Anti-double-submit (button disables/"Sending…").
- [ ] Admin → Contact Messages shows the submission.
- [ ] Footer "Contact" link present; mobile layout clean.

## 10. Discovery / Trending
- [ ] Homepage "Trending guides" section shows published articles (featured + recent); no fake view numbers.
- [ ] "Latest guides" only appears when there are extras beyond cover + trending (no misleading empty block).
- [ ] All discovery surfaces published-only; drafts never appear.

## 11. SEO / structured data
- [ ] Homepage has Organization + WebSite (SearchAction) JSON-LD.
- [ ] Article pages have Article + BreadcrumbList JSON-LD; byline links to /about; disclosure links to /affiliate-disclosure.
- [ ] Category pages have BreadcrumbList JSON-LD.
- [ ] `/newsletter/*` and `/search` are noindex; `/contact` + trust pages indexable and in sitemap.

## 12. Deploy tooling
- [ ] `infra/server/deploy-app.sh` is the documented deploy path: rebuilds fresh, migrates with detached stdin, and aborts if the running image ≠ freshly built image.
