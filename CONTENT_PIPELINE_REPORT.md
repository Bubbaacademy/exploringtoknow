# CONTENT_PIPELINE_REPORT.md

_Updated: 2026-06-11T02:43:23Z. How the single-article workflow flows through the system._

## Flow (LangGraph orchestration — unchanged from blueprint)
```
Product (catalog)
   └─ runContentPipeline(product, brand)        [@etk/ai]
        START → gen_intelligence → gen_brief → gen_article → quality_gate
                                                  │ pass → END
                                                  │ fail & attempts<max → regenerate → gen_article
                                                  └ exhausted → flag → END
```
- Prompts: `@etk/prompts` registry (versioned; brand profile injected into every prompt).
- Model calls: `@etk/providers` (Claude/OpenAI; mock fallback when no key).
- Cost/tokens: `CostMeter` → persisted to `generation-runs`.

## Persistence (Payload local API — source of truth)
| Step | Collection | Notes |
|---|---|---|
| Brand | `brands` | find-or-create |
| Product | `products` | offerType=amazon_affiliate, status=active |
| Intelligence | `product-intelligence` | personas/pains/benefits/intent/CTAs |
| Brief | `content-briefs` | title/angle/keywords/articleType, status=ready |
| Article | `articles` | markdown + SEO/OG + qaReport; status=**published** when QA passes |
| Run ledger | `generation-runs` | status, attempts, tokens, cost, per-step usage |

## Publishing → public render (new this phase)
- Article `status` is set to `published` (+ `publishedAt`) only when the quality gate passes.
- Public route `(site)/[...slug]/page.tsx` queries Payload for `{ slug, status: published }`,
  renders `markdown` via `marked`, and emits SEO/OG through `generateMetadata`. 404 otherwise.
- Public URL shape: `https://exploringtoknow.com/<article-slug>`.

## Quality gate (no human approval)
Deterministic checks (disclosure, CTA, meta lengths, headings, min length, forbidden
terms) + a brand-voice judge. Fail → bounded regenerate → flag. Only `published`
articles are ever publicly visible.

## Entry points
- `validate:ryze`  — single RYZE case against the real (VPS/local) DB.
- `validate:local` — offline real-DB end-to-end (embedded Postgres), used for this report.
- `run:golden` / `golden:batch` — existing golden-product runners (unchanged).
