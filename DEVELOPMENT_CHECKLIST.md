# Development Checklist

## Phase 0 — Foundation  (this deliverable)
- [x] Monorepo + pnpm workspaces
- [x] Turborepo pipeline (`turbo.json`)
- [x] Root TS config, lint/format, `.gitignore`, `.nvmrc`
- [x] `.env.example` full contract + Phase-0 required vars
- [x] Next.js 15 app: `(site)`, `(dashboard)`, `(payload)`, `api/`
- [x] Payload integration prep (`payload.config.ts`, Users + Media)
- [x] PostgreSQL integration prep (`@etk/db` pool + `ping`, migrations dir)
- [x] Internal dashboard auth architecture (`lib/auth.ts` + `middleware.ts`)
- [x] Worker runtime skeleton (entry, scheduler, pg-boss queues, jobs)
- [x] LangGraph skeleton (`@etk/ai`: content + refresh graphs, stub nodes)
- [x] Health endpoint (`/api/health`)
- [x] README + this checklist + dependency list
- [x] Repo structure aligned with implementation package §2

### Phase 0 — first runnable verification (do after `pnpm install`)
- [ ] `pnpm install` resolves cleanly
- [ ] `docker compose -f infra/docker-compose.yml up -d` (Postgres up)
- [ ] `pnpm --filter @etk/web generate:types` succeeds
- [ ] `pnpm typecheck` passes across the workspace
- [ ] Web boots; `/admin` loads; create first operator user
- [ ] `/api/health` returns `ok`
- [ ] Worker boots; logs `worker_ready` + `scheduler_started`
- [ ] (Optional) enqueue `generate-content` once → LangGraph stub graph runs end-to-end

## Phase 1 — Catalog & AI core  (next, on approval)
- [ ] Operational migrations `0001_init_ops.sql` (pipeline_runs, jobs, …)
- [ ] Payload content collections: products (8 offer types), product_intelligence,
      content_briefs, articles, social_posts
- [ ] Catalog CRUD + bulk add + status lifecycle + force-generate hook → queue
- [ ] `@etk/ai` provider abstraction (Claude + OpenAI) + prompt registry
- [ ] Real intelligence → brief → article → quality gate nodes
- [ ] Bounded regenerate / retry / flag

## Phase 2 — Publish & Distribute
- [ ] Article page rendering + SEO/OG/JSON-LD + CTA/related
- [ ] Tracking link engine + `/go/:code` + click logging
- [ ] Meta client (FB + IG) + social composer/publisher + token refresh

## Phase 3 — Measure
- [ ] GA4 / GSC / Amazon Attribution / HubSpot / Meta connectors → metric_snapshots
- [ ] Rollups + attribution joins
- [ ] Dashboard 8 views over snapshots

## Phase 4 — Autonomy & Refresh
- [ ] Daily orchestrator wires the full loop
- [ ] Refresh queue producer/consumer + refresh suggestion graph

## Phase 5 — Hardening & Launch
- [ ] Budgets, alerts, idempotency hardening
- [ ] Golden-product end-to-end test (the first MVP E2E)
- [ ] Failure injection + internal launch
