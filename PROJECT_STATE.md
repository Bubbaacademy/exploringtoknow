# PROJECT_STATE.md

> Current snapshot. Updated 2026-06-16 after Phase 4 deployment & live verification.
> Documentation only — no application code, schema, worker, generation, publishing,
> category, approval, image-population, affiliate logic, or database data changed by
> this update.

---

## Current production state (verified live)

| Item | Value |
|---|---|
| Production HEAD | **`main @ 7975891`** (Phase 4 merge; fast-forwarded from Phase 3 `1bcd201`) |
| Local `main` HEAD | `7975891` (in sync with production) |
| Running app image | `etk-web@sha256:7209f7e0…` (Phase 4; only the app + migrate ran) |
| Worker / Postgres / Caddy | **Unchanged** — not rebuilt/recreated in Phase 4 (worker up 26h, Postgres/Caddy up 5d, 0 restarts) |
| App health | Healthy, 0 restarts |
| Pending jobs | **0** |
| DB ungranted locks / long-running transactions | **0 / 0** |
| Payload migrations applied | **7** (latest: `20260616_010000_newsletter_subscribers`) |

### Rollback points
| Tag | Points to | Phase |
|---|---|---|
| `prod-pre-phase4-trust` | `1bcd201` | before Phase 4 |
| `prod-pre-phase3-discovery` | `dcfb3bb` | before Phase 3 |
| `prod-pre-phase2-navsearch` | `181e953` | before Phase 2 |
| `pre-ui-redesign` (local) | `af7846a` | before Phase 1 |

---

## Completed phases

**Phase 1 — Premium design system + homepage redesign: COMPLETE & DEPLOYED.**
Shared editorial design system (warm paper background, deep-forest brand, restrained
terracotta accent, serif display + sans body, tokens, cards, buttons, header/footer
foundation, responsive behavior) and the redesigned homepage.

**Phase 2 — Global navigation, native search, premium article experience: COMPLETE & DEPLOYED.**
Scalable Topics mega menu (real categories) + accessible mobile drawer; native
published-only server-side search (`/search`, noindex) + listing routes; premium
article page (masthead, reading progress, TOC, in-article disclosure, related);
standardized "Request a Review" CTA.

**Phase 3 — Premium discovery layer: COMPLETE & DEPLOYED.**
- Category page redesign (editorial masthead: name, description, published count, trust line; magazine grid; elegant empty state).
- Categories hub / topic discovery (`/categories`) — grouped editorial sections, count badges, mobile-friendly topic cards.
- Explore hub (`/explore`) — featured/newest cover, latest guides, browse-by-topic, buying-guides/reviews entry points, graceful fallbacks.
- Search + listing route polish (centered search hero, popular-topic suggestions, premium empty states on `/buying-guides` and `/reviews`).
- Premium article page improvements carried forward: reading progress, table of contents, article masthead, affiliate disclosure, related-content discovery.
- Published-only gates preserved; no paid image API; no auto-publish; article integrity verified (fingerprints unchanged).

**Phase 4 — Magazine trust + request-flow polish + newsletter: COMPLETE & DEPLOYED.**
- Request-product form polish (UI/UX + a11y only): editorial masthead, grouped fieldsets, clearer validation messages and guidance.
  - Required category selection preserved.
  - "Other / Not Sure" requires a short suggested category.
  - Image upload guidance: minimum 3 / maximum 30, accepted types shown (JPEG/PNG/WebP), permission checkbox explained.
  - Anti-double-submit + loading state; entered values preserved on validation failure.
  - Combobox keyboard navigation (`aria-activedescendant`).
  - Approval/generation logic unchanged; request submission still creates `submitted` requests only.
- Newsletter capture:
  - Additive `NewsletterSubscribers` collection/table with an additive migration.
  - Signup component on the homepage, near the end of articles, and in the footer.
  - Server-side email validation, dedupe by email, honeypot; no external email provider, no automation.
- Trust pages added: `/about`, `/editorial-policy`, `/affiliate-disclosure` (original content).
- Footer / navigation links updated (editorial footer with trust-page links + newsletter).
- No existing published article content changed; no generation triggered; no paid image API used.

### Phase 4 DB backup
`/opt/exploringtoknow/backups/pre-phase4_20260616_010853.sql.gz` (verified before migration: gzip OK, 48 tables, article data present).

### Phase 4 migration
- `20260616_010000_newsletter_subscribers` — **additive only**.
- Creates `newsletter_subscribers` (unique `email`, `source`, `status`, `created_at`/`updated_at` timestamps) plus the admin lock relation column on `payload_locked_documents_rels`.
- Payload migrations count moved from **6 → 7**. No existing table/column/data altered.

---

## Verified live routes (Phase 4)

`200`: `/`, `/request-product`, `/about`, `/editorial-policy`, `/affiliate-disclosure`,
`/categories`, `/category/sleep-wellness`, `/explore`, `/search`, `/buying-guides`,
`/reviews`, `/sitemap.xml`, published article route.
**`404`:** draft article route remains inaccessible (published-only gate intact).

---

## Safety & integrity (carried through Phases 2–4)

- Public visibility gated solely by `editorialStatus = 'published'`; drafts/ready_for_review/rejected never exposed.
- No paid image-generation API; manual product-image system unchanged.
- No Anthropic/OpenAI generation triggered during any UI deploy; `generation_runs` unchanged.
- No auto-publish; category-required publish guard intact.
- Article content fingerprints (title/markdown/prose) unchanged across deploys.
- Affiliate URLs and `rel="sponsored nofollow noopener"` preserved.

---

## Known limitations

- **Manual browser pixel-level responsive review still needed** (verified structurally + via SSR only).
- **Screen-reader / accessibility manual review still needed** (ARIA, focus management, and keyboard paths verified by construction + SSR, not by assistive-tech automation).
- **Newsletter is local capture only** — no external email provider, no double opt-in/unsubscribe, no automation yet.

---

## Phase 5 candidates (NOT started)

1. Connect the newsletter to a real email provider with double opt-in and unsubscribe.
2. Trending / Most-Read module (after analytics exists).
3. Author profile / "About the author" pages.
4. Contact page.
5. Multi-step request form (if needed).
6. Deploy-script hardening so migrate/build/app-swap cannot silently reuse stale images
   (force `run --build`, detach stdin, separate the app swap from the piped script).
