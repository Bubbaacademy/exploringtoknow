# infra/

Infrastructure-as-code, deploy configuration, and environment templates.

## Phase 0 scope
- Local dev runs Postgres via `infra/docker-compose.yml`.
- Web app (Next.js) deploys to Vercel **or** AWS.
- Worker requires a **long-running** runtime (AWS ECS/Fargate or a dedicated
  Node host) — Vercel functions are short-lived and cannot host the orchestrator.
  This decision is flagged in the implementation package (§1.4, §15) and should
  be finalized before Phase 4 (orchestrator).

Real IaC (Terraform/CDK) is added in a later phase. Phase 0 ships only the
local docker-compose below.
