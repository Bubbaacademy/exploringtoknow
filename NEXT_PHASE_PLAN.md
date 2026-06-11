# NEXT_PHASE_PLAN.md

_Updated: 2026-06-11T02:22:25Z. The deployed MVP is technically stable. Below is the recommended
order. Nothing here is started without your explicit go-ahead._

## Status checkpoint
Infrastructure ✔ · App online ✔ · Worker stable ✔. The platform is a **functional
MVP**, not a finished product.

## Phase S — Production stabilization (RECOMMENDED NEXT, low risk)
1. **Backups:** nightly `pg_dump` → `/opt/exploringtoknow/backups` (cron) + retention + a tested restore.
2. **Observability:** container restart-policy audit, log rotation, basic uptime/health alerting (app + worker + cert expiry).
3. **Secrets hygiene:** document rotation for DB password / `PAYLOAD_SECRET`; consider a managed secret store.
4. **CI:** typecheck + build on push; optionally build images in CI and deploy by digest.
5. **Worker bundle cleanup:** declare `@anthropic-ai/sdk` + `openai` as explicit worker deps to externalize them — removes the `punycode` warning, slims the image.

## Phase U — Premium UI redesign (SEPARATE milestone — NOT now)
> Current UI is **functional MVP only**. The current Payload admin and placeholder
> dashboard/site pages are scaffolding, not final.
Final product must be premium:
- **Public site:** LoveToKnow-style content experience — article templates, category
  IA, typography/readability, fast SEO-clean pages.
- **Internal dashboard:** modern SaaS quality (Linear / Notion / Loft) — design system,
  component library, real Products/Content/Social/Tracking/Analytics/Health views.
Treated as its own design + build phase with explicit approval. No UI redesign yet.

## Phase A — Enable real AI generation (requires explicit approval + key)
Add `ANTHROPIC_API_KEY` to the VPS env, run **one golden-product** generation, review
output quality + cost via `generation-runs` / the evaluator, then scale gradually with
budget guards. Not started until you approve.

## Hard guardrails (unchanged)
Do NOT redesign UI yet · do NOT start social automation · do NOT start video
generation · do NOT start affiliate auto-discovery · do NOT run real AI generation
without approval. Do not touch Postgres / Payload / web / Caddy outside a scoped,
reviewed deployment. **Master Blueprint preserved; no architecture changes without justification.**

## Suggested immediate next step
Approve **Phase S (stabilization)** — backups + alerting + the worker bundle cleanup —
as small, independently-reviewable commits. Lowest risk, highest operational payoff,
and it sets up safe iteration before the UI and AI phases.
