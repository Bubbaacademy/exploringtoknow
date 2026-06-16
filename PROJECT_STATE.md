# PROJECT_STATE.md

> Current snapshot. Updated 2026-06-16 after Phase 5 deployment & live verification.
> Documentation only — no application code, schema, or data changed by this update.

---

## Current production state (verified live)

| Item | Value |
|---|---|
| Production HEAD | **`main @ 6333011`** (Phase 5 merge; fast-forwarded from Phase 4 `7975891`) |
| Local `main` HEAD | `6333011` (in sync with production) |
| Running app image | `etk-web@sha256:22a88b89…` (Phase 5; only app + migrate ran) |
| Worker / Postgres / Caddy | **Unchanged** — not rebuilt/recreated (worker up 27h, Postgres/Caddy up 5d, 0 restarts) |
| App health | Healthy, 0 restarts |
| Pending jobs / locks / long-tx | **0 / 0 / 0** |
| Payload migrations applied | **8** (latest: `20260616_020000_phase5_newsletter_contact`) |

### Rollback points
| Tag | Points to | Phase |
|---|---|---|
| `prod-pre-phase5-magazine` | `7975891` | before Phase 5 |
| `prod-pre-phase4-trust` | `1bcd201` | before Phase 4 |
| `prod-pre-phase3-discovery` | `dcfb3bb` | before Phase 3 |
| `prod-pre-phase2-navsearch` | `181e953` | before Phase 2 |

---

## Completed phases

**Phase 1** — Premium design system + homepage redesign. COMPLETE & DEPLOYED.

**Phase 2** — Global navigation (Topics mega menu + mobile drawer), native published-only search + listing routes, premium article page. COMPLETE & DEPLOYED.

**Phase 3** — Discovery layer: category page redesign, topics hub, explore hub, search/listing polish. COMPLETE & DEPLOYED.

**Phase 4** — Magazine trust: request-form polish, newsletter capture (additive), About / Editorial Policy / Affiliate Disclosure pages, editorial footer. COMPLETE & DEPLOYED.

**Phase 5 — Magazine completion (newsletter system, contact, trust/discovery/SEO, deploy hardening): COMPLETE & DEPLOYED.**
- **Newsletter system:** expanded subscriber lifecycle (statuses active / pending / unsubscribed / bounced / complained + legacy subscribed) with `provider`, `confirmedAt`, `unsubscribedAt`, `tokenHash` columns. Provider abstraction (`lib/newsletter.ts`) defaults to safe **local mode** (immediate active, no external calls); double opt-in is provider-gated and ready. Upgraded `/api/newsletter` (dedupe, token, re-subscribe). Token-based `/newsletter/confirm` and `/newsletter/unsubscribe` pages (noindex; flip status only, never delete). Signups on homepage, article end, footer. Subscribers visible in admin.
- **Contact:** `/contact` page (reasons + validated form, honeypot, anti-double-submit, aria-live), additive `ContactMessages` collection, `/api/contact`; footer + sitemap links.
- **Trust layer:** article byline links to `/about`; in-article disclosure links to `/affiliate-disclosure`; footer links About / Editorial Policy / Affiliate Disclosure / Contact / Request a Review.
- **Discovery:** deterministic **Trending guides** on homepage (featured + recency; **no fabricated view counts**); Latest hides gracefully when thin.
- **SEO / structured data:** Organization + WebSite (SearchAction) JSON-LD on homepage; BreadcrumbList JSON-LD on article + category pages; canonicals/meta preserved; sitemap updated; search + token pages noindex.
- **Deploy hardening:** `infra/server/deploy-app.sh` — rebuilds app + migrate fresh, runs migrations with stdin detached (`run --build -T </dev/null`), and **fails loudly if the running app image ≠ the freshly built image**. Fixes the Phase-4 stale-image / swallowed-stdin failure mode.

### Phase 5 migration
- `20260616_020000_phase5_newsletter_contact` — **additive only**. Adds newsletter status enum values (via `ADD VALUE IF NOT EXISTS`, not used in the same transaction) + newsletter columns; creates `contact_messages` table + admin lock relation. Pre-validated against the live prod schema in a rolled-back transaction. Payload migrations **7 → 8**.

### Phase 5 DB backup
`/opt/exploringtoknow/backups/pre-phase5_20260616_021548.sql.gz` (verified before migration: gzip OK, 49 tables, article data present).

---

## Verified live routes (Phase 5)

`200`: `/`, `/categories`, `/category/sleep-wellness`, `/explore`, `/search`, `/buying-guides`,
`/reviews`, `/request-product`, `/about`, `/editorial-policy`, `/affiliate-disclosure`, `/contact`,
`/newsletter/confirm`, `/newsletter/unsubscribe`, `/sitemap.xml`, published article route.
**`404`:** draft article route (published-only gate intact).

---

## Safety & integrity (held through Phase 5)

- Public visibility gated solely by `editorialStatus = 'published'`; drafts never exposed; draft URLs 404.
- No paid image-generation API; manual product-image system unchanged.
- No generation/approval triggered; `generation_runs` unchanged (5). No auto-publish.
- Article content fingerprints (title/markdown/prose) **identical to baseline** for all published articles.
- Affiliate URLs and `rel` attributes unchanged (UI/trust presentation only).
- No duplicate articles/media; counts unchanged (articles 5, published 3, media 45).
- Additive migrations only; verified DB backup + rollback tag before deploy.

---

## Known limitations

- **Manual browser pixel-level responsive review still needed** (verified structurally + via SSR only).
- **Screen-reader / a11y manual review still needed.**
- **Newsletter runs in local-capture mode** — no external email provider wired yet, so confirmation/unsubscribe emails are not delivered (the schema, tokens, and routes are ready; double opt-in activates when a provider + `NEWSLETTER_DOUBLE_OPT_IN=true` are configured).
- **No real analytics** — "Trending" is a deterministic editorial ranking, not view-based.
- Content remains thin (3 published articles); some listings legitimately show empty states.

---

## Phase 6 candidates (NOT started)

1. Wire newsletter to a real email provider (confirmation + unsubscribe delivery, double opt-in).
2. Lightweight first-party pageview analytics (additive table) to power real "Most Read".
3. Author profile pages / per-author bylines (schema-backed).
4. Contact → email notification/routing for the editorial inbox.
5. Multi-step request form (if conversion data warrants).
6. Per-category hero imagery + richer category SEO.
7. Optional Postgres `pg_trgm` search index once content volume grows.
