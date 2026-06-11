# NEXT_PHASE_PLAN.md

## 0. Close out current task (now)
1. Sync repo to `c158c5f` on the VPS.
2. Rebuild + restart the `worker` container only.
3. Run `verify-app.sh` → confirm all containers healthy (app, worker, postgres, caddy).

## 1. Production stabilization (recommended next, low risk)
- Automated `pg_dump` backups to `/opt/exploringtoknow/backups` (cron) + retention.
- Container log rotation + restart policies audit; basic uptime/health alerting.
- Move secrets to a managed store; rotate `PAYLOAD_SECRET`/DB password procedure.
- CI: typecheck + build on push; (optional) build images in CI, deploy by digest.
- Add explicit worker deps (`@anthropic-ai/sdk`, `openai`) to slim the bundle.

## 2. Premium UI redesign (separate milestone — NOT now)
The current Payload admin + placeholder dashboard are functional MVP only. The
public content experience (LoveToKnow-style) and the internal dashboard
(Linear/Notion/Loft quality) are a dedicated design+build phase: design system,
component library, article templates, navigation/IA. Requires its own approval.

## 3. Enable real AI generation (requires explicit approval + key)
Add `ANTHROPIC_API_KEY` to the VPS env, run one golden-product generation, review
outputs/cost via `generation-runs`, then scale. Gated on your go-ahead.

## Out of scope until explicitly scheduled
Social automation (FB/IG), video generation, affiliate auto-discovery, analytics
connectors. Master Blueprint preserved; no architecture changes without justification.
