# ExploringToKnow — Autonomous Affiliate & Commerce Content Engine

Internal, single-tenant commerce-content operating system for Bubba Holding.
**No SaaS · no customer accounts · no billing · no multi-tenancy · no Google
Sheets · no WordPress · no manual approval workflow.** Facebook + Instagram only
for Phase 1 social.

This repo currently contains the **Phase 0 foundation** only. AI generation,
publishing, Meta publishing, and analytics connectors are intentionally NOT yet
implemented (later phases — see `docs/` implementation package).

## Architecture (unchanged from approved baseline)

| Layer | Role |
|-------|------|
| Next.js 15 / React (`apps/web`) | Public content site + internal dashboard + Payload admin + API routes |
| Payload CMS (`apps/web/src`) | Content & catalog source of truth |
| PostgreSQL | One database — Payload collections + operational tables |
| Worker runtime (`apps/worker`) | Long-running background jobs (orchestrator) |
| LangGraph (`packages/ai`) | AI workflow orchestration ONLY — intelligence, brief, article, quality gate, regeneration, social generation, refresh suggestions |
| AWS S3 | Media/storage (wired Phase 1+) |

**LangGraph boundary (important):** LangGraph orchestrates the content/QA/
regeneration/social/refresh graph inside `packages/ai`. It does **not** handle
product CRUD, the dashboard UI, Payload collections, public website rendering,
tracking redirect routes, the database schema, the Meta API client itself, or
analytics dashboard rendering.

## Prerequisites
- Node.js >= 20.11 (`.nvmrc` = 20)
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.12.0 --activate`)
- Docker (for local Postgres) — or any reachable PostgreSQL 16

## Setup
```bash
# 1. install
corepack enable
pnpm install

# 2. environment
cp .env.example .env
#   set DATABASE_URL, PAYLOAD_SECRET, AUTH_SECRET (minimum for Phase 0)

# 3. database (local)
docker compose -f infra/docker-compose.yml up -d

# 4. generate Payload types (after deps installed)
pnpm --filter @etk/web generate:types

# 5. run
pnpm dev                 # all apps via Turborepo
# or individually:
pnpm --filter @etk/web dev      # http://localhost:3000  (site + /admin + dashboard)
pnpm --filter @etk/worker dev   # background worker + scheduler
```

## Verify Phase 0
- `http://localhost:3000` → public site placeholder
- `http://localhost:3000/admin` → Payload admin (create first operator user)
- `http://localhost:3000/products` → redirects to login when unauthenticated
- `GET http://localhost:3000/api/health` → `{ "status": "ok" }`
- worker logs `worker_ready` and `scheduler_started`

## Monorepo layout
```
apps/web      Next.js 15 app — (site) public, (dashboard) internal, (payload) admin, api/
apps/worker   long-running job runtime — scheduler, pg-boss queues, jobs
packages/core shared config, env, logger, types
packages/db   operational Postgres client + migrations (non-Payload tables)
packages/ai   LangGraph graphs + nodes (AI orchestration only)
packages/...  intelligence content publishing social tracking analytics (reserved)
infra/        docker-compose (local pg), deploy notes
docs/         approved implementation package + ADRs
```

## What is NOT in Phase 0
AI model calls · article generation · product intelligence · Meta publishing ·
analytics connectors · tracking redirect logic · content collections beyond
Users/Media. These are stubbed/reserved and land in later phases.
