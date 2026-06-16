# PROJECT_STATE.md

> Current snapshot. Updated 2026-06-16 after Phase 8 deployment & live verification.
> Documentation only — no application code, schema, or data changed by this update.

---

## Current production state (verified live)

| Item | Value |
|---|---|
| Production HEAD | **`main @ 5d80ddc`** (Phase 8 merge; ff from Phase 7 `2f17557`) — docs commit synced on top |
| Local `main` HEAD | matches prod (app code) + docs commit |
| Running app image | `etk-web@sha256:7754ccb1…` (verified == freshly-built) |
| Worker / Postgres / Caddy | **Unchanged** — not rebuilt/recreated (worker up 30h, Postgres/Caddy up 5d, 0 restarts) |
| App health | Healthy, 0 restarts |
| Pending jobs / locks / long-tx | **0 / 0 / 0** |
| Payload migrations applied | **11** (latest: `20260616_050000_phase8_authors`) |

### Rollback points (prod tags)
`prod-pre-phase8-editorial-growth → 2f17557` · `prod-pre-phase7-growth-ops → fa171df` ·
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

## Phase 9 candidates
1. Configure Resend in prod env + verify real deliverability + enable double opt-in.
2. Real multi-author roster + assignment workflow + per-author SEO.
3. Analytics: unique/session signal, referrer breakdown, time-series charts.
4. Category hero imagery population + featured-topic curation surfaces.
5. tsvector full-text ranking atop pg_trgm as content grows.
6. Editorial workflow automation (assignment/SLAs) for contact + request queues.
