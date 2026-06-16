# PROJECT_STATE.md

> Current snapshot. Updated 2026-06-16 after Phase 7 deployment & live verification.
> Documentation only — no application code, schema, or data changed by this update.

---

## Current production state (verified live)

| Item | Value |
|---|---|
| Production HEAD (deployed code) | **`main @ 23fcdba`** (Phase 7 merge; ff from Phase 6 `fa171df`) |
| Local `main` HEAD | `23fcdba` + a docs commit (identical application code) |
| Running app image | `etk-web@sha256:1ac9bf53…` (verified == freshly-built image) |
| Worker / Postgres / Caddy | **Unchanged** — not rebuilt/recreated (worker up 28h, Postgres/Caddy up 5d, 0 restarts) |
| App health | Healthy, 0 restarts |
| Pending jobs / locks / long-tx | **0 / 0 / 0** |
| Payload migrations applied | **10** (latest: `20260616_040000_phase7_ops`) |

### Rollback points (prod tags)
`prod-pre-phase7-growth-ops → fa171df` · `prod-pre-phase6-growth → f89eaea` ·
`prod-pre-phase5-magazine → 7975891` · `prod-pre-phase4-trust → 1bcd201` ·
`prod-pre-phase3-discovery → dcfb3bb` · `prod-pre-phase2-navsearch → 181e953`

---

## Completed phases (1–7)

Phases 1–6: design system, navigation+search, discovery, trust+newsletter, newsletter
lifecycle+contact+SEO+deploy-hardening, growth infra (authors, first-party analytics,
email provider layer, category hero). See git history.

**Phase 7 — Growth + editorial operations: COMPLETE & DEPLOYED.**
- **Search upgrade:** `pg_trgm` extension + GIN trgm indexes on article `title`/`markdown`/`excerpt` — transparently accelerates the existing **published-only** ILIKE search (no query change). Verified published-only; special/long/mixed queries safe; drafts never returned.
- **Analytics + Most Read:** `/api/track` now filters obvious bot user-agents (verified: bot UA not recorded, real UA recorded); still privacy-light (article id + UTC day + count, no PII), published-only. New auth-gated **dashboard Analytics** surface: per-article 7-day / 30-day / all-time views with status/category/author + an email-delivery presence panel (env **present/missing only — never values**). Public "Most Read" uses real views when present, else honest deterministic ranking (**no fabricated counts**).
- **Authors:** `sortOrder` added; multi-author ready; default "ExploringToKnow Editorial Team" + display fallback for unassigned/new articles (no generation-pipeline change needed). `/author/[slug]` + Person JSON-LD live.
- **Editorial inbox:** Contact statuses `new/reviewed/archived/spam` (+legacy read), `notifyStatus` (records editor-alert result), `reviewedBy`/`reviewedAt`, `source`; clearer admin columns + helper text. Product Requests admin clarified (helper text/columns) — **approval/business logic unchanged** (manual approval, category required, 3–30 images + permission enforced).
- **Email delivery:** provider layer (Resend via fetch, local-safe default) from Phase 6 retained; contact notification now records `notifyStatus`.

### Phase 7 migration
`20260616_040000_phase7_ops` — **additive/idempotent**: `pg_trgm` + GIN trgm indexes; contact `notify_status`/`reviewed_by_id` + status values `reviewed`/`spam`; `authors.sort_order`. Pre-validated (privilege + DDL) in a rolled-back transaction. Payload migrations **9 → 10**.

### Phase 7 DB backup
`/opt/exploringtoknow/backups/pre-phase7_20260616_035951.sql.gz` (verified before migration: gzip OK; includes articles, newsletter_subscribers, contact_messages, article_views, authors, categories, product_requests; article data present).

---

## Email / newsletter provider — activation env (secrets via env only, never printed)

```
NEWSLETTER_PROVIDER=local|resend        # default local (no external send)
RESEND_API_KEY=...                      # required for resend
NEWSLETTER_FROM="ExploringToKnow <hello@exploringtoknow.com>"
NEWSLETTER_REPLY_TO=...                  # optional
NEWSLETTER_DOUBLE_OPT_IN=true|false      # optional; pending → confirm flow
CONTACT_NOTIFY_TO=...                    # optional editorial inbox for contact alerts
```
Dashboard → Analytics shows each of these as **present/missing** (never the value). When unset: subscribers captured `active`/`local`, contact stored with `notifyStatus=local_no_send`, no external email sent.

---

## Verified live routes (Phase 7)
`200`: `/`, `/categories`, `/category/sleep-wellness`, `/explore`, `/search`, `/search?q=led`,
`/buying-guides`, `/reviews`, `/request-product`, `/contact`, `/about`, `/editorial-policy`,
`/affiliate-disclosure`, `/newsletter/confirm`, `/newsletter/unsubscribe`,
`/author/exploringtoknow-editorial-team`, `/sitemap.xml`, published article.
**`404`:** draft article. **`307`** (auth redirect): `/dashboard/analytics`.

---

## Safety & integrity (held through Phase 7)
Published-only gate intact (drafts 404; never in search/analytics/discovery; bot views filtered). No paid image API; manual-image system unchanged. No generation/approval triggered (`generation_runs` = 5); no auto-publish (published = 3). Article fingerprints (title/markdown/prose) **identical to baseline**. Affiliate URLs/rel unchanged (AffiliateCTA untouched). No duplicate articles/media (media = 45). Additive migrations only; verified backup + rollback tag before deploy. No secrets in code/commits/logs.

---

## Known limitations
- Email delivery is **local-only until a provider is configured** (env block above).
- Analytics bot-filtering is user-agent-based (best-effort, not security); no IP/rate analytics.
- "Most Read" needs real traffic to diverge from the deterministic ranking.
- Manual browser pixel-level responsive + screen-reader QA still pending (see `QA_CHECKLIST.md`).
- Authors are single (Editorial Team) until more are created/assigned.
- Content remains thin (3 published).

## Phase 8 candidates
1. Configure Resend in prod env + verify deliverability + enable double opt-in.
2. Real multi-author roster + assign authors during/after generation.
3. Analytics: unique-visit/session signal, referrer breakdown, time-series charts.
4. Category hero imagery population + featured-topic curation on discovery.
5. Full-text search (tsvector) ranking on top of trgm if content grows.
6. Editorial workflow automation (assignment, SLAs) for contact + request queues.
