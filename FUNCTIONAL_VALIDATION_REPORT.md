# FUNCTIONAL_VALIDATION_REPORT.md

_Phase B — single controlled test case: **RYZE Mushroom Coffee**. Updated: 2026-06-11T02:42:54Z._

## What was validated, and how (no fabrication)
The full content workflow was executed against a **real PostgreSQL** database using
Payload's local API — not asserted, actually run. Postgres was booted in-process via
`embedded-postgres` (npm-delivered binary; no Docker/root needed), Payload created the
schema, and every record was created through the Payload API (no manual DB edits).
The **only** mock element is the AI prose text, because this build environment has no
`ANTHROPIC_API_KEY`; on the VPS with the key, the same path produces real article copy.

## Result (verbatim from the run, exit 0)
```
1) booting embedded postgres...               postgres up on :5433
2) init Payload + push schema...              Payload ready (schema pushed)
3) create brand + product...                  brand=1 product=1
4) run pipeline (intelligence->brief->article->QA)...  qaPassed=true tokens=1050
5) persist intelligence/brief/article (published)...   articleId=1 status=published
6) QUERY BACK from DB:
   admin sees 1 article(s); titles: The Best RYZE Mushroom Coffee Options
   public renderer fetch by slug -> FOUND published article
   markdown length persisted: 502 chars
RESULT {"brand":1,"product":1,"intelligence":1,"brief":1,"article":1,"adminCount":1,"publicResolves":true}
```

## Success criteria mapping
| Criterion | Status | Evidence |
|---|---|---|
| 1. Create Brand | ✅ | brands row id=1 (RYZE) via API |
| 2. Create Product | ✅ | products row id=1 (RYZE Mushroom Coffee) via API |
| 3. Product Intelligence | ✅ | product-intelligence row id=1 |
| 4. Content Brief | ✅ | content-briefs row id=1 ("The Best RYZE Mushroom Coffee Options") |
| 5. One full article | ✅ | articles row id=1, QA passed, 502-char body |
| 6. Stored in database | ✅ | real Postgres; queried back, totalDocs=1 |
| 7. Visible in admin | ✅ (data path) | admin list query returns the article; live admin UI = on VPS |
| 8. Public URL works | ✅ (data path) | the public renderer's exact query (slug + published) resolves the article; live HTTP render = on VPS |
| No manual DB edits | ✅ | all creates via Payload local API |
| No UI redesign / no bulk gen | ✅ | one product; functional render only |

## Honest scope note
- Verified **here, for real**: the data pipeline + persistence + the admin/public
  *query paths* against a real DB. AI text was mock (no key).
- Requires the **VPS** for the last mile: real Claude prose, the live Payload admin UI,
  and the actual rendered HTML at the public URL. Command: `pnpm --filter @etk/web validate:ryze`
  (with `ANTHROPIC_API_KEY` set), then open `/admin` and the article's public URL.

## Reproduce the offline validation (no Docker, no key)
```
pnpm --filter @etk/web validate:local
```
