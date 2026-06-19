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

## 36. Phase 25 — Social Studio foundation
**VERIFIED LIVE 2026-06-19 — prod HEAD `3d293c3`, image `etk-web` (id `sha256:96918ee9…`) healthy; migrations 20→21; content unchanged (gen 5/art 5/media 45); legacy `social_posts` untouched (0 rows). Temp-owner E2E (created→checked→deleted, zero residue): unauth create 401; CTA javascript: → 422; cross-tenant relatedProduct + foreign relatedLandingPage both stored null; post stamped to temp tenant (ETK had 0); approve → approved_to_copy; copied → copyCount 1; pickers scoped (no ETK leak). Manual + copy-export only — no social/AI/schedule/publish/external calls.**
- [ ] `/app/social-posts` (owner/admin/editor): list + New; `/new` create form; `/[id]` edit with status actions (Mark ready / Approve to copy / Back to draft / Archive / Restore) + delete. Viewer → read-only.
- [ ] Editor: channel + format selectors with per-channel helper copy; hook/caption/hashtags; CTA label + URL; product/request/landing-page pickers (workspace-only; "Use link → CTA" manual prefill, http(s)-validated); Brand Kit helper + "use brand disclosure"; live preview/copy panel composes the post text; copy-to-clipboard with non-browser fallback.
- [ ] Approve-to-copy is the furthest a post goes — NOTHING is generated, scheduled, or posted to any network; no platform API/OAuth. The `copied` counter is first-party only (no external call), allowed only when approved.
- [ ] Tenant isolation: a workspace only sees its own social posts; posts stamped server-side to the actor's tenant/workspace; no ETK/global leakage; pickers show only workspace products/requests/landing pages.
- [ ] Cross-tenant tamper: relatedProduct/relatedRequest/relatedLandingPage/relatedBrandProfile set to a foreign id is ignored server-side (stored null).
- [ ] Role/access: create/edit/action/delete require canWrite (401 unauth, 403 viewer); writes server-scoped (client tenant/workspace ids ignored); CTA rejects javascript:/data:.
- [ ] Create-from-landing-page: landing-page detail "Create social post" → preselects related landing page + prefills (published) public URL into a draft; no copy generated, no publish, no API.
- [ ] Safety: no AI/generation/approval/publish/schedule/social/ad/image/video/email/billing/external calls; legacy `social-posts` pipeline untouched; public magazine + landing pages + gates unchanged; migration additive (down() safe).

## 35. Phase 24 — Landing Page enrichment + analytics
**VERIFIED LIVE 2026-06-19 — prod HEAD `b11d01d`, image `etk-web@sha256:97024fcf…` healthy; migrations 19→20; content unchanged (gen 5/art 5/media 45). Temp-owner E2E (created→checked→deleted, zero residue): cross-tenant relatedProduct rejected (null); top-level + section CTA javascript: rejected/stripped; sections render; analytics counted 2 real pings, excluded bot; scoped to temp tenant.**
- [ ] Editor: product/request picker shows only workspace items (empty-state links to /app/products & /app/product-requests); "Use link → CTA" prefills CTA (manual, http(s)-validated); structured sections editor (add/remove/reorder, 7 types); Brand Kit helper + "use brand disclosure"; analytics view count shown.
- [ ] Cross-tenant tamper: setting relatedProduct/relatedRequest to a foreign id is ignored server-side (stored null).
- [ ] CTA validation: top-level + cta_block section URLs accept only http/https; javascript:/data: rejected or stripped; public CTAs keep rel="nofollow sponsored noopener".
- [ ] Public /lp renders structured sections (escaped, no raw HTML); falls back to body when no sections; Phase 23 pages still render; published-only (404 otherwise); noindex respected.
- [ ] Analytics: /api/lp-track counts only published pages, one row per page/day, bot-filtered, no PII; counts scoped to workspace on list + detail; no fake metrics.
- [ ] Safety: no AI/generation/approval/publish-automation/email/billing/social/ad/image/external calls; affiliate logic unchanged; public magazine + gates unchanged; migration additive (down() safe).

## 34. Phase 23 — Landing Page foundation
**VERIFIED LIVE 2026-06-18 — prod HEAD `9bcc25c`, image `etk-web@sha256:b9202591…` healthy; migrations 18→19; content unchanged (gen 5/art 5/media 45). Temp-owner E2E (created→checked→deleted, zero residue): draft hidden (404) → CTA javascript: rejected (422) → explicit publish → public 200 with content → cross-workspace 404 (isolation). Public magazine + gates unchanged.**
- [ ] `/app/landing-pages` (owner/admin/editor): list + New; `/new` create form; `/[id]` edit with status actions (ready / publish / unpublish / archive / restore) + delete. Viewer → read-only.
- [ ] Publishing is explicit (button + confirm); nothing publishes automatically; publish requires title+slug.
- [ ] Public `/lp/[workspaceSlug]/[slug]`: published only; draft/archived/missing/wrong-workspace → 404; brand colors applied (hex-validated); CTA http(s)-only with rel="nofollow sponsored noopener"; disclosure shown when set; noindex respected.
- [ ] Tenant isolation: a workspace only sees its own pages; slug unique per workspace; same slug under another workspace 404s; no ETK/global leakage.
- [ ] Role/access: create/edit/delete require canWrite (401 unauth, 403 viewer); writes server-scoped (client ids ignored); CTA rejects javascript:/data:.
- [ ] Safety: no AI/generation/article/approval/email/billing/Stripe/ad/social/image-API calls; public magazine routes unchanged; no binary upload added.

## 33. Phase 22 — Brand Kit / Asset Library foundation
**VERIFIED LIVE 2026-06-18 — prod HEAD `4ea5b66`, image `etk-web@sha256:11d175ad…` healthy; migrations 17→18 (phase22 applied); content unchanged (gen 5/art 5/media 45). Tenant isolation + config↔DB + owner role gate verified via temp owner (created→checked→deleted, zero residue). Email + billing still local-safe.**
- [ ] `/app/brand` (owner/admin): editable brand form (name, publication, description, audience, voice, editorial style, colors, website, social links, affiliate disclosure, focus notes) + asset manager (add/remove, type + permission labels). Empty states + helper copy.
- [ ] Viewer/editor → read-only brand view (no edit form); page route 307 when unauthenticated.
- [ ] Role gate: `/api/app/brand` and `/api/app/brand/assets` reject non-owner/admin (403) and unauthenticated (401); writes are server-scoped (client tenant/workspace ids ignored); delete re-checks workspace ownership.
- [ ] Tenant isolation: a workspace only ever sees its own brand profile/assets; no ETK/global brand data leaks; one profile per workspace.
- [ ] Safety: no AI/generation/publish/image/email/billing/Stripe/external calls; public magazine + /platform + /dashboard + /admin gates unchanged; no binary upload added (metadata/reference entries only).

## 32. Phase 21 — Billing/Plans/Usage real activation (Stripe-ready, local-safe verification)
**VERIFIED LIVE 2026-06-18 — prod HEAD `dfa94f5`, image `etk-web@sha256:6536c7ee…` healthy; migrations 17 (unchanged); content unchanged (gen 5/art 5/media 45). All billing/Stripe env ABSENT → local-safe (no charges); webhook inert (`ignored: billing-not-configured`, no DB write). Public routes 200; `/app`/`/app/billing`/`/platform`/`/dashboard` 307; `/admin` 200. Email still local-safe.**
Prod has no Stripe/billing env → must stay local-safe (no real charges); verify behavior, never expose keys.
- [ ] `/app/billing` (owner): plan cards (Starter/Pro/Agency + Enterprise→Contact sales), usage meters reflect real counts, "online checkout isn't active" notice when `billingLive()` false, Manage-billing button present.
- [ ] Non-owner → "Only the workspace owner can view and manage billing." Page + checkout/portal owner-gated.
- [ ] Checkout (local-safe): POST returns `disabled` notice (no Stripe call); portal returns disabled when no env/customer.
- [ ] Webhook inert without env: POST → `{ok:true, ignored:"billing-not-configured"}`, no tenant write.
- [ ] Banners: trial countdown / trial-expired / **inactive (canceled/unpaid)** / **past-due** render per `subscriptionStatus`.
- [ ] Enforcement: trial-expired AND canceled/unpaid block new requests/uploads/invites (402), data stays readable; comped (ETK) unlimited.
- [ ] (When env later added, Stripe TEST mode first) checkout sets tenant.plan via webhook; portal plan change maps price→plan; never print keys.
- [ ] No generation/approval/publish/email/charge side effects; tenant isolation intact; public magazine unchanged.

## 31. Phase 20 — Real email provider activation (local-safe verification)
**VERIFIED LIVE 2026-06-18 — prod HEAD `40174e6`, image `etk-web@sha256:13af565b…` healthy; migrations 17 (unchanged); all six email env keys ABSENT → local-safe (no real send); public routes 200; `/app`/`/platform`/`/dashboard` 307; `/admin` 200; no secrets printed; content unchanged (gen 5/art 5/media 45).**
Prod has all six email env keys ABSENT → must stay local-safe; verify behavior + report missing key NAMES only (never values).
- [ ] `/dashboard/health` → "Email delivery": provider/mode shows **local-safe**, "Missing to activate" lists key NAMES only, all six env keys show present/missing (NO values), per-flow readiness table shows local-safe.
- [ ] Signup (temp owner): account creates and lands `/app` 200; welcome email is **best-effort** — signup still completes (local-safe = no send); no secret in logs.
- [ ] Team invite (temp owner): invite creates; UI shows **copy-link fallback** (local-safe); invitation `emailStatus=local_no_send`; copyable single-use link works; wrong-email/duplicate/seat-limit protections intact.
- [ ] Newsletter: valid subscribe → active/local (no send); duplicate → idempotent; invalid → 422; honeypot → silent success. Unsubscribe token page works + idempotent.
- [ ] Contact: valid submit stored with `notifyStatus=local_no_send` (no send); honeypot silent; never blocks user.
- [ ] No secrets in UI / logs / report; no generation/approval/publish/image/affiliate change; tenant isolation unchanged; temp records cleaned up.
- [ ] (When env later added) flip NEWSLETTER_PROVIDER=resend + keys → readiness shows real-send; one controlled minimal test per flow; never print the API key.

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

---

# Phase 11 additions — author/analytics/merch (no migration)

Production `main` @ `3db25f5` · app image `etk-web@sha256:fc7df617…`. Migrations 12 (unchanged).

## 35. Author SEO
- [ ] Author with published work (Editorial Team) is indexable + in sitemap; author byline links work.
- [ ] An author with NO published articles renders noindex and is excluded from the sitemap.
- [ ] Authors list ordered by sortOrder then name.

## 36. Category merchandising
- [ ] Categories order featured-first → sortOrder → count → name.
- [ ] /explore shows a "Featured topics" row only when categories are flagged featured (graceful otherwise).

## 37. Search
- [ ] Author-name query returns that author's published articles; published-only; special/long/empty safe.
- [ ] Title matches still rank above excerpt/category/author/body.

## 38. Analytics + triage (admin)
- [ ] /dashboard/analytics shows a 14-day daily-views bar trend (empty state when no views).
- [ ] /dashboard shows product-request triage warnings (missing category/permission/<3 images/URL) only when >0.
- [ ] No fabricated views/popularity anywhere public.

---

# Phase 12 additions — admin pro redesign (no migration)

Production `main` @ `e934169` · app image `etk-web@sha256:ea107fb4…`. Migrations 12 (unchanged).

## 39. Admin console (auth — log in first)
- [ ] /dashboard renders the premium console: sidebar groups, system-overview stats, needs-attention warnings, pipeline stats, activity cards, quick links.
- [ ] /dashboard/analytics: 14-day trend bars, most-read table with status badges, delivery-presence (present/missing only — no secret values).
- [ ] /dashboard/health: counts grid, provider presence, recent intake.
- [ ] Sidebar links open the correct Payload collections; "Payload Admin" + "View site" footer links work.
- [ ] Status badges color-coded but also labeled (not color-only); empty states honest; no fabricated numbers.
- [ ] Unauthenticated: /dashboard* redirect (307); /admin loads Payload login.

## 40. Collection admin clarity
- [ ] Products: description warns activate/force-generate triggers the pipeline; image guidance shown.
- [ ] Newsletter/Categories/Authors descriptions + columns clearer; no fields/logic changed.

## 41. Admin responsive/a11y (manual)
- [ ] Sidebar collapses to a row under ~900px; no horizontal overflow at 1024/1280/1440; tablet readable.
- [ ] Links/buttons keyboard-focusable with visible focus; contrast reasonable.

---

# Phase 12B additions — native Payload /admin branding (no migration)

Production `main` @ `f24bc89` · app image `etk-web@sha256:6dbe655c…`. Native admin theme proven live (brand color + titleSuffix in deployed admin assets).

## 42. Native /admin visual (log in to confirm)
- [ ] Browser tab shows "… · ExploringToKnow Ops".
- [ ] Login + collection screens: primary buttons are brand forest; left nav is branded (dark forest, grouped); warm paper background.
- [ ] Collection list/edit screens readable; status columns + descriptions clear.
- [ ] ProductRequests status field shows the ⚠ "approving triggers generation" note; option reads "Approved (triggers generation)".
- [ ] Light/dark theme both acceptable (html[data-theme]).
- [ ] /admin + all /admin/collections/* load (200); dashboards still 307 when logged out.

## 43. Known limitation
- Deep Payload component theming (custom Nav/Logo, list-cell badges) not done (needs importMap; avoided for safety). Theme is CSS-variable + class-hook based; final pixel polish needs a human logged-in pass.

---

# Phase 13 additions — multi-tenant SaaS foundation (migration 12 → 13)

Production `main` @ `c8a68a2` · app image `etk-web@sha256:1e721192…` · ExploringToKnow = tenant/workspace #1.
Automated checks already PASSED live (see PROJECT_STATE Phase 13). Items below need a **logged-in** pass.

## 44. Gating (verified live unauthenticated; re-confirm logged-in)
- [x] `/app` and `/platform` redirect to `/admin/login` (307) when unauthenticated.
- [ ] Logged-in as the super-admin owner: `/platform` renders (platform totals + per-tenant rollup; ExploringToKnow listed: 1 workspace, 3 published, 3 products).
- [ ] Logged-in: `/app` renders the ExploringToKnow workspace overview; all counts match the editorial console; "Your access" shows the platform_super_admin membership.
- [ ] `/dashboard` (editorial console) and `/admin` still work unchanged.

## 45. Tenant data integrity (verified live via SQL; spot-check in /admin)
- [x] Exactly 1 Tenant (`exploringtoknow`), 1 Workspace (`exploringtoknow`, mode exploring_network), 1 Membership (platform_super_admin) — no duplicates.
- [x] Every row in all 10 operational collections has `tenant` = ExploringToKnow (0 NULL).
- [x] Published articles = 3 (unchanged); no generation/approval triggered (generation_runs = 5); article fingerprints stable.
- [ ] In `/admin`, the Platform group shows Tenants/Workspaces/Memberships; existing collections show a Tenant field set to ExploringToKnow.

## 46. Public site unchanged (verified live)
- [x] All public routes 200; published article 200; draft + bogus author 404; sitemap 200.
- [ ] Spot-check homepage/article/category visually — no change vs pre-Phase-13.

## 47. Known follow-ups (roadmap)
- Authenticated super-admin happy-path render of `/app` + `/platform` (gating + build verified; logged-in pass pending).
- Native `/admin` + collection `access` are still operator-wide; per-tenant tightening + media isolation deferred to the "real second tenant" phase (need a 2nd tenant to verify isolation safely). → **Done in Phase 14.**

---

# Phase 14 additions — tenant isolation hardening + workspace scoping (migration 13 → 14)

Production `main` @ `8a7e7ef` · app image `etk-web@sha256:9bb22b91…`. Isolation proven by
`scripts/verify-tenant-isolation.ts` (26/26 PASS on prod, temporary 2nd tenant, no residue).

## 48. Access control (verified live / by script)
- [x] super admin reads all tenants' data; workspace member reads only their own tenant (all 13 scoped collections).
- [x] anonymous native-REST read = published-only for articles; hard-deny for products/product-requests/etc.
- [x] `/admin` is platform-super-admin-only (Users.access.admin); workspace user blocked; anon blocked.
- [x] writes never trust client tenant/workspace ids (stamp hook forces actor membership; system→ETK default).
- [ ] Logged-in as a (future) workspace editor: confirm `/admin` shows the access-denied screen and `/app` works.
- [ ] Logged-in super admin: `/platform` "Tenant isolation health" panel shows all-clear; `/app` summary scoped.

## 49. Data integrity (verified live via SQL)
- [x] 0 null tenant AND 0 null workspace across all 14 scoped collections.
- [x] tenants/workspaces/memberships = 1/1/1, users = 1, no duplicates, no `iso-test%` residue.
- [x] published=3 and generation_runs=5 unchanged; migrations=14; 0 jobs / 0 long-tx / 0 ungranted locks.

## 50. Public site unchanged (verified live)
- [x] all public routes 200; published article 200; draft 404; `/admin` 200; `/api/health` 200; `/app`+`/platform` → 307.

## 51. Remaining limitations / next
- Media files are served statically (public by design); only listing/management is tenant-scoped.
- Reference collections (categories/authors/media/brands) keep public anon read; authed members are tenant-scoped.

---

# Phase 15 additions — public signup + onboarding + free trial (migration 14 → 15)

Production `main` @ Phase-15 merge. Signup proven by `scripts/verify-signup-onboarding.ts` (create→assert→delete on prod).

## 52. Signup / auth (live + by script)
- [x] `/signup` 200 (renders the form when `PUBLIC_SIGNUP_ENABLED=true`, else a tasteful early-access state; API 403 when off).
- [x] `/login` 200; `/api/auth/{signup,login,logout}` set/clear the `payload-token` cookie.
- [x] Signup creates exactly 1 tenant + 1 workspace + 1 `workspace_owner` membership + trial metadata; no content/generation/media side effects.
- [x] Duplicate email → friendly 409; workspace slug sanitized + auto-uniqued; ids server-derived (never client-trusted).
- [ ] With `PUBLIC_SIGNUP_ENABLED=true` + logged in as the new owner: `/app` shows welcome + trial banner + onboarding checklist; cannot reach `/platform`, `/admin`, or `/dashboard`.

## 53. Access / isolation (re-verified)
- [x] New owner isolated from ExploringToKnow across all scoped collections; ETK super admin sees both; ETK untouched.
- [x] `/dashboard` is now super-admin-only (workspace owners redirected to `/app`); `/admin` + `/platform` still gated.

## 54. Data integrity (live)
- [x] No duplicate tenants/workspaces/memberships; ETK tenant/workspace untouched; signup test rows cleaned up.
- [x] published count + generation_runs unchanged; no approval/generation triggered; 0 jobs / 0 long-tx / 0 locks.

## 55. Intentionally NOT included yet
- Billing/Stripe, custom domains/DNS/SSL, real email provider sending, AI generation automation, ad automation.
- Per-workspace product/article creation tooling (owner currently sees an informational checklist) — Phase 18.

## 56. Recommended next
- Phase 16: Real email-provider activation (verification + welcome email) OR Billing/Plans/Usage limits.

---

# Master Blueprint v2 QA / Future Phase Guardrails

Standing guardrails for every future phase (owned-media + social + ads + landing-page AI OS). Re-verify these
on each phase that touches workspace data, generation, publishing, social/ads, analytics, or providers.

- [ ] Multi-tenant isolation remains **server-side** (scope derived from membership; never from client input).
- [ ] Workspace users can **never** see another tenant's data (articles, products, requests, media, analytics, team, billing).
- [ ] **No auto-generation / auto-publish / ad-spend / campaign launch without explicit human approval.**
- [ ] Social / ad / video outputs are **plan/usage-gated** before any public scale (expensive outputs metered).
- [ ] Analytics clearly **separate real measured data from fallback / editorial ranking** (no blending).
- [ ] Email provider secrets are **env-only** (never printed/committed; health shows present/missing only).
- [ ] Ad / social provider secrets are **env-only** (never printed/committed; OAuth tokens stored safely, scoped per workspace).
- [ ] **No fake performance metrics** (impressions/clicks/CTR/CPC/spend/conversions are real or clearly empty).
- [ ] **No fake reviews / ratings / testimonials.** No fabricated product claims.
- [ ] **No duplicate** article / media / product / author / category creation on retry/double-submit.
- [ ] Existing **ETK public magazine stays stable** (routes 200, drafts 404, published fingerprints unchanged) while the SaaS expands.
- [ ] Every new write path: server-authorized, role-checked, tenant-scoped, dedup-safe, with clear non-crash error states.
- [ ] Cross-tenant tampering (ID swap in body/URL) is rejected; webhooks update only the matching tenant and are idempotent.
- [ ] Backup + rollback tag before any migration; additive/idempotent migrations only; deploy verified live.
