# docs/

- `Bubba-Content-Engine-Implementation-Package` — the approved architecture
  baseline (15 sections). Treat as fixed; do not redesign without a critical
  blocker.
- ADRs (Architecture Decision Records) are added here as decisions are made.

## ADR log (Phase 0)
- **ADR-0001 — Monorepo + Turborepo + pnpm.** Single repo; web and worker share
  `packages/*`.
- **ADR-0002 — pg-boss for the job queue.** Postgres-backed; avoids a Redis
  dependency in the MVP. Revisit if throughput demands BullMQ.
- **ADR-0003 — LangGraph scoped to AI orchestration only.** It orchestrates the
  content/QA/regeneration/social/refresh graph inside `packages/ai`, consumed by
  the worker. It does NOT touch CRUD, Payload, UI, public rendering, tracking
  redirects, the DB schema, the Meta client, or analytics rendering.
