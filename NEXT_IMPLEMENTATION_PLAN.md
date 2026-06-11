# NEXT_IMPLEMENTATION_PLAN.md

_Updated: 2026-06-11T02:43:23Z. Phase B (functional validation) is complete. Nothing below starts
without your explicit approval._

## Confirm on the VPS (closes Phase B end-to-end with REAL AI)
1. Sync repo to `bfb6681`; rebuild **web only** (renderer + scripts changed):
   `docker compose --profile app build app && docker compose --profile app up -d --no-deps app`.
2. Set `ANTHROPIC_API_KEY` in `/opt/exploringtoknow/env/.env` (single article, not bulk).
3. `docker compose --profile app run --rm app pnpm --filter @etk/web validate:ryze`
   (or run on the host) → produces a real RYZE article.
4. Open `/admin` → confirm the article; open its public URL → confirm it renders.

## Then — recommended order (each gated on approval)
1. **Stabilization** (from prior plan, still pending): pg_dump backups, log rotation,
   uptime/cert alerting, secrets rotation, CI; optional worker-bundle slim-down.
2. **Publishing hardening**: JSON-LD/structured data, related-articles, canonical,
   sitemap/robots, category + home listing pages, internal links from the brief plan.
3. **Premium UI redesign** (separate milestone): LoveToKnow-style public content
   experience + Linear/Notion-grade internal dashboard. Current UI is **functional MVP only**.
4. **Controlled scale-up**: a handful of real products with budget guards + the
   content evaluator, before any volume.

## Hard guardrails (unchanged)
No UI redesign yet · no infra changes · no bulk AI generation · no social automation ·
no affiliate discovery. Do not touch Postgres/Payload/web/Caddy outside a scoped,
reviewed deployment. Master Blueprint preserved.
