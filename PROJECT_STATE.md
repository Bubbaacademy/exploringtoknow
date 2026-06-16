# PROJECT_STATE.md

> Current snapshot. Updated 2026-06-16 after Phase 6 deployment & live verification.
> Documentation only — no application code, schema, or data changed by this update.

---

## Current production state (verified live)

| Item | Value |
|---|---|
| Production HEAD (deployed code) | **`main @ d8384fe`** (Phase 6 merge; fast-forwarded from Phase 5 `f89eaea`) |
| Local `main` HEAD | `d8384fe` + a docs commit (identical application code) |
| Running app image | `etk-web@sha256:57d297d8…` (verified == freshly-built image) |
| Worker / Postgres / Caddy | **Unchanged** — not rebuilt/recreated (worker up 28h, Postgres/Caddy up 5d, 0 restarts) |
| App health | Healthy, 0 restarts |
| Pending jobs / locks / long-tx | **0 / 0 / 0** |
| Payload migrations applied | **9** (latest: `20260616_030000_phase6_growth`) |

### Rollback points (prod tags)
`prod-pre-phase6-growth → f89eaea` · `prod-pre-phase5-magazine → 7975891` ·
`prod-pre-phase4-trust → 1bcd201` · `prod-pre-phase3-discovery → dcfb3bb` · `prod-pre-phase2-navsearch → 181e953`

---

## Completed phases (1–6)

**Phase 1** design system + homepage · **Phase 2** nav + search + premium article ·
**Phase 3** discovery (category/hub/explore) · **Phase 4** trust pages + newsletter capture + editorial footer ·
**Phase 5** newsletter lifecycle + contact + SEO/discovery + deploy hardening.

**Phase 6 — Growth infrastructure: COMPLETE & DEPLOYED.**
- **Newsletter provider readiness:** `lib/email.ts` provider layer (Resend via HTTP/fetch, no SDK dep) + `lib/newsletter.ts`. Default = safe **local mode** (no sends). Confirmation/unsubscribe remain tokenized (SHA-256 hash stored, never the raw token) + friendly invalid-token states. Admin fields: `provider`, `confirmedAt`, `unsubscribedAt`, `lastEmailStatus`, `tokenHash`.
- **First-party analytics:** additive `article_views` (privacy-light: article id + UTC day + count; no PII). `/api/track` records **published-only** views (drafts/bogus ignored), client `ViewTracker` beacon (non-blocking). `listMostReadArticles(days, limit)` powers homepage "Trending" when data exists; honest deterministic fallback otherwise (**never fabricated counts**).
- **Authors:** `Authors` collection + `Article.author` relationship. Seeded "ExploringToKnow Editorial Team" and backfilled all articles (additive metadata only — content fingerprints preserved). `/author/[slug]` page (bio + published-only work + Person JSON-LD); byline links to author (falls back to Editorial Team). Author pages in sitemap.
- **Contact / editorial inbox:** added `source` + `reviewedAt`; optional best-effort notification to `CONTACT_NOTIFY_TO` when a provider is configured (local-safe otherwise).
- **Category SEO/hero:** additive `heroImage`, `longDescription`, `featured`, `sortOrder`; richer masthead with hero image + elegant fallback; BreadcrumbList JSON-LD (from Phase 5) retained; published-only listing preserved.
- **Search:** evaluated `pg_trgm` — **skipped** (low content volume; current published-only ILIKE is adequate; `CREATE EXTENSION` needs elevated DB privileges). Revisit at scale.
- **Deploy hardening:** `infra/server/deploy-app.sh` used for this deploy — rebuilds fresh, migrates with stdin detached, and **aborts if the running image ≠ freshly built image**. Logs prev/new image id, migration count before/after, health.

### Phase 6 migration
`20260616_030000_phase6_growth` — **additive only** (authors + article_views tables; articles.author_id; category hero/seo cols; newsletter.last_email_status; contact source/reviewed_at; admin lock relations; default-author seed + backfill). Pre-validated in a rolled-back transaction against live prod. Payload migrations **8 → 9**.

### Phase 6 DB backup
`/opt/exploringtoknow/backups/pre-phase6_20260616_030947.sql.gz` (verified before migration: gzip OK, 50 tables, article data present).

---

## Newsletter / email provider — activation (when ready)

Local-safe by default; set these env vars on the VPS (`/opt/exploringtoknow/env/.env`) to enable real delivery — **secrets only via env, never in code/commits**:

```
NEWSLETTER_PROVIDER=resend        # local (default) | resend
RESEND_API_KEY=...                # required for resend
NEWSLETTER_FROM="ExploringToKnow <hello@exploringtoknow.com>"
NEWSLETTER_REPLY_TO=...           # optional
NEWSLETTER_DOUBLE_OPT_IN=true     # optional; pending → confirm flow
CONTACT_NOTIFY_TO=...             # optional editorial inbox for contact pings
```

When unset, subscribers are captured `active` (provider `local`, `lastEmailStatus=local_no_send`) and no email is sent. SMTP is stubbed (treated as disabled) — wire via the same `lib/email` interface later.

---

## Verified live routes (Phase 6)
`200`: `/`, `/categories`, `/category/sleep-wellness`, `/explore`, `/search`, `/search?q=led`,
`/buying-guides`, `/reviews`, `/request-product`, `/contact`, `/about`, `/editorial-policy`,
`/affiliate-disclosure`, `/newsletter/confirm`, `/newsletter/unsubscribe`,
`/author/exploringtoknow-editorial-team`, `/sitemap.xml`, published article.
**`404`:** draft article, bogus author.

---

## Safety & integrity (held through Phase 6)
Published-only gate intact (drafts 404, never in search/analytics/discovery). No paid image API; manual-image system unchanged. No generation/approval triggered (`generation_runs` = 5). No auto-publish (published = 3). Article fingerprints (title/markdown/prose) **identical to baseline**. Affiliate URLs/rel unchanged. No duplicate articles/media. Additive migrations only; verified backup + rollback tag before deploy. No secrets in code/commits/logs.

---

## Known limitations
- Newsletter/contact email delivery is **local-only until a provider is configured** (see env block above).
- Analytics is first-party + privacy-light; "Most Read" needs real traffic to differ from the deterministic ranking. No bot-filtering beyond published-only validation.
- Manual browser pixel-level responsive + screen-reader QA still pending (see `QA_CHECKLIST.md`).
- `pg_trgm` search index deferred (low volume + privilege requirement).
- Content remains thin (3 published).

## Phase 7 candidates
1. Configure a real email provider (Resend) + verify deliverability; enable double opt-in.
2. Analytics dashboard + bot filtering + 7/30/all-time "Most Read" surfaces.
3. Per-author real profiles (multiple authors, avatars, social) + author assignment in generation.
4. Category hero imagery population (manual) + richer category landing design.
5. `pg_trgm`/full-text search once content volume grows.
6. Editorial inbox workflow (statuses, assignment) for contact + request queues.
