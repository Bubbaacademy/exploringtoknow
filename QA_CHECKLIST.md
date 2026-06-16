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

---

# Phase 6 additions — manual QA

Production `main` @ `d8384fe` · app image `etk-web@sha256:57d297d8…`. Routes verified `200`; draft + bogus-author `404`.

## 13. Authors & bylines
- [ ] Article byline links to /author/exploringtoknow-editorial-team (or assigned author).
- [ ] /author/[slug] shows role, bio, and published-only articles; bogus slug → 404.
- [ ] Article + author pages carry Person JSON-LD; unassigned articles fall back to "ExploringToKnow Editorial Team".
- [ ] Admin → Authors editable; assigning an author updates the byline.

## 14. Analytics & Most Read
- [ ] Visiting a published article records a view (admin → Article Views); draft views are NOT recorded.
- [ ] Homepage "Trending" uses real views when present; otherwise deterministic ranking — never fake numbers.
- [ ] /api/track always returns 204 and never blocks page paint.

## 15. Newsletter provider
- [ ] Local mode (default): subscribe → active, provider `local`, lastEmailStatus `local_no_send`, no email sent.
- [ ] After setting NEWSLETTER_PROVIDER=resend + RESEND_API_KEY (+ NEWSLETTER_DOUBLE_OPT_IN), a test subscribe sends a confirmation and confirm link activates the pending subscriber.
- [ ] Unsubscribe link flips status to unsubscribed (record retained).

## 16. Category hero / SEO
- [ ] Category with a hero image shows the framed hero; without one, the masthead fallback looks intentional.
- [ ] Category SEO title/description applied; BreadcrumbList JSON-LD present.

## 17. Contact routing
- [ ] Contact submit stores a message (source=contact-page); with CONTACT_NOTIFY_TO + provider, an editorial notification is sent (best-effort, never blocks the user).

## 18. Deploy tooling
- [ ] `infra/server/deploy-app.sh` is the deploy path: rebuilds fresh, migrates (stdin detached), aborts if running image ≠ freshly built image; logs image ids + migration count + health.

---

# Phase 7 additions — manual QA

Production `main` @ `23fcdba` · app image `etk-web@sha256:1ac9bf53…`. Routes verified `200`; draft `404`; `/dashboard/analytics` `307` (auth).

## 19. Search (pg_trgm-backed)
- [ ] /search?q=led returns published results only; drafts never appear.
- [ ] Mixed case / partial / special chars / very long query all safe (no 500).
- [ ] Results still fast; ordering sensible.

## 20. Analytics & bot filtering
- [ ] Visiting a published article (real browser) records a view; a bot user-agent does NOT.
- [ ] Draft / bogus id record nothing.
- [ ] Dashboard → Analytics (logged in) shows 7d/30d/all-time per article with status/category/author.
- [ ] Dashboard shows email-delivery config as present/missing only (no secret values).
- [ ] Public "Most Read" shows real ordering when data exists, else deterministic fallback — no fake numbers.

## 21. Editorial inbox
- [ ] Contact Messages admin: status New/Reviewed/Archived/Spam; reviewedBy/reviewedAt; notifyStatus recorded.
- [ ] Product Requests admin: helper text clarifies manual approval; category + 3–30 images + permission still enforced; nothing auto-approves/publishes.

## 22. Authors
- [ ] Authors support sortOrder; byline links to author; unassigned articles fall back to Editorial Team.

## 23. Email provider activation (when ready)
- [ ] Set NEWSLETTER_PROVIDER=resend + RESEND_API_KEY (+ NEWSLETTER_FROM, optional NEWSLETTER_DOUBLE_OPT_IN, CONTACT_NOTIFY_TO) in env; verify dashboard shows "present" and a test subscribe/contact sends mail.

---

# Phase 8 additions — manual QA

Production `main` @ `5d80ddc` · app image `etk-web@sha256:7754ccb1…`. Routes `200`; draft/bogus-author `404`; dashboards `307` (auth).

## 24. Email provider (local-safe)
- [ ] With no provider env: newsletter subscribe → active/local, contact → stored, no email sent.
- [ ] Dashboard → System Health & Analytics show provider keys as present/missing only (NO values).
- [ ] After setting provider env later: presence flips to "present" and confirmation/contact paths send.

## 25. Multi-author
- [ ] /author/[slug] shows expertise chips + long bio when set; published-only list; bogus/inactive → 404.
- [ ] Article byline links to author; unassigned → Editorial Team.

## 26. Search ranking
- [ ] /search?q=led ranks title matches first, then excerpt/category/author, then body; published-only; no drafts.
- [ ] empty/special/long/mixed-case queries safe.

## 27. Admin dashboards (auth)
- [ ] /dashboard/health: counts (published/drafts/categories/subscribers/contacts/requests/media/views) + recent intake; redirects when not logged in.
- [ ] /dashboard/analytics: 7/30/all-time most-read; redirects when not logged in.

## 28. Category merchandising
- [ ] Category with both guides + reviews shows split sections (no duplicate cards); otherwise single grid; hero/SEO/breadcrumb intact; published-only.

## 29. Desktop/mobile + a11y (manual)
- [ ] 320/375/640/768/1024/1440 no horizontal overflow; keyboard nav for menu/search/drawer; visible focus; form status messages announced; reduced motion respected.

## 30. Safety re-checks
- [ ] No generation/approval/auto-publish; published fingerprints unchanged; affiliate CTA dest/rel unchanged; media count not duplicated.

---

# Phase 9 — verification status (2026-06-16)

Production `main` @ `570c3e5` (unchanged this phase — docs only). Email provider env: **all missing → local-safe mode**.

## Verified by code / route / DB checks (automated)
- [x] All public routes return 200; draft + bogus author/category → 404.
- [x] `/dashboard/health` + `/dashboard/analytics` → 307 (auth-gated).
- [x] `/api/health` ok; app/worker/postgres/caddy healthy; 0 restarts.
- [x] generation_runs=5, articles=5, published=3, media=45 (all unchanged); pending jobs/locks/long-tx = 0.
- [x] Published fingerprints (3/4/7) identical to baseline.
- [x] Search published-only + ranking; no-results empty state renders.
- [x] Newsletter confirm/unsubscribe invalid-token pages friendly + noindex,nofollow; `/search` noindex,follow.
- [x] Newsletter trust copy present; author field graceful omission.
- [x] Email provider env presence = all missing → local-safe (no external send).

## Still needs HUMAN visual confirmation (cannot be done from SSR/headless here)
- [ ] Pixel-level layout at 320 / 375 / 640 / 768 / 1024 / 1440 (no overflow, comfortable spacing).
- [ ] Mobile drawer open/close animation, focus trap, Escape, focus restore — live.
- [ ] Search combobox keyboard usability + screen-reader announcements — live.
- [ ] Newsletter/contact form focus order + aria-live status — live with assistive tech.
- [ ] Card/button hierarchy + CTA tone judged visually as "premium, not spammy".
- [ ] Category hero rendering once a hero image is uploaded.

## Email provider activation (when ready) — local-safe until set
Set on the VPS `/opt/exploringtoknow/env/.env` (then recreate the app container):
`NEWSLETTER_PROVIDER=resend`, `RESEND_API_KEY=…`, `NEWSLETTER_FROM=…`, `NEWSLETTER_REPLY_TO=…`,
`NEWSLETTER_DOUBLE_OPT_IN=true`, `CONTACT_NOTIFY_TO=…`. Verify via Dashboard → System Health
(keys flip to "present") then a controlled subscribe/contact test.

---

# Phase 10 additions — editorial platform

Production `main` @ `9b6c36d` · app image `etk-web@sha256:f6dbeac5…`. Migrations 12.

## 31. Editorial overview dashboard (auth)
- [ ] /dashboard (logged in) shows pipeline stats, warnings (missing category/author/hero), top-viewed, recent requests/contacts; redirects when logged out.
- [ ] /dashboard, /dashboard/analytics, /dashboard/health are noindex + auth-gated (307 when logged out).
- [ ] Warnings reflect reality (currently zero — all published have category/author/hero).

## 32. Content production clarity (admin)
- [ ] Articles admin description explains publish gate + editorial standards; defaultColumns show author + publishPriority.
- [ ] GenerationRuns admin description explains the pipeline chain; "published" run status ≠ public publish.
- [ ] editorialNotes + publishPriority editable (admin-only; never public, never auto-publish).

## 33. Pipeline legibility (read-only)
- [ ] Request → Product → Article chain visible in admin (linkedProduct/linkedArticle, requested category, image permission, image count).
- [ ] Manual approval still required; category required; 3–30 images + permission enforced; no generation/approval triggered during QA.

## 34. Content guardrails (editorial)
- [ ] Published copy: no hype, no fabricated testing/medical claims; "researched/reviewed/selected/tested" used accurately; affiliate disclosure present; images manual + permission-confirmed.
