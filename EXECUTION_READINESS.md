# EXECUTION_READINESS.md — Final Production Run

_Updated: 2026-06-12T00:38:30Z. Maximum local verification complete. One live step remains: the
real Anthropic call + publish, which runs on the VPS._

## Blueprint status
| Capability | State |
|---|---|
| VPS / Docker / Postgres / Payload / public site / worker | LIVE (operator-verified) |
| Content pipeline (intelligence→brief→article→QA→regenerate) | VERIFIED |
| Production prompts (article@2, brief@2 — EEAT/human/honest) | ACTIVE (registry selects latest) |
| Quality scoring (readability/SEO/affiliate/overall) | IMPLEMENTED |
| Public article renderer (reads Payload, markdown+SEO, 404) | IMPLEMENTED |
| Payload initial migration | COMMITTED |
| FLANCCI validation case (ASIN B09DY1ZHKS) | WIRED |
| Reports auto-generation (3 files w/ scores) | VERIFIED |
| Slug-collision guard on publish | ADDED |

## Pre-flight verification (run here against REAL embedded Postgres — all PASS)
brand · product · intelligence · brief · article persisted; article **published**;
public renderer's exact slug+published query **resolves** it; markdown **renders to HTML**;
generation-runs ledger persisted; all 3 reports generated with Overall/SEO/Readability/
Affiliate-usefulness/Reading-grade scores. Reproduce anytime:
`pnpm --filter @etk/web verify:preflight`.

## Remaining blockers
**None at code level.** The only remaining item is the live model call, which requires
the ANTHROPIC_API_KEY + production DB on the VPS (cannot run from the build environment).

## Exact execution command (VPS)
After syncing the repo to the commit below and rebuilding the web image:
```bash
# from the repo on the VPS
docker compose --profile app build app
docker compose --profile app up -d --no-deps app
docker compose --profile app run --rm -e ANTHROPIC_API_KEY app \
  pnpm --filter @etk/web validate:flancci
```

## Expected outputs (console)
JSON: { brandId, productId, intelligenceId, briefId, articleId, articleStatus:"published",
passed:true, genMs, tokens, cents, adminUrl, publicUrl, scores:{...} } and `mock:false`.

## Expected report files (written to the app working dir)
- REAL_AI_VALIDATION_REPORT.md — title, public URL, word count, time, tokens, cost, overall score
- TOKEN_COST_REPORT.md — per-step model + input/output tokens + USD cost + totals + time
- QUALITY_EVALUATION_REPORT.md — reading grade, readability/SEO/affiliate-usefulness/
  brand-compliance/overall scores, plus voice/disclosure/forbidden checks

## Expected article URL pattern
`https://exploringtoknow.com/<article-slug>`  (slug derived from the AI title; the real
v2 prompt returns a concise human title, e.g. https://exploringtoknow.com/how-to-dim-bright-led-lights-for-better-sleep)

## Final readiness assessment
**READY.** Zero code-level blockers. Every step that can be proven without a live API key
has been proven against a real database. Running the single command above on the VPS
produces the one real article, publishes it, renders it publicly, and writes the three
reports with real measured numbers.
