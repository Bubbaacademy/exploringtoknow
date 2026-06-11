# CURRENT_PRODUCTION_STATUS.md

> Live status below is from YOUR confirmed checks (this build environment has no
> SSH route to 45.76.26.5). Re-generate authoritative live status anytime with
> `infra/server/verify-app.sh` on the VPS.

## Confirmed UP (user-verified)
| Component | Status |
|---|---|
| https://exploringtoknow.com (homepage) | UP |
| /api/health | `ok` |
| /admin (Payload) | UP, first admin user created |
| Payload dashboard | accessible |
| PostgreSQL | healthy, not publicly exposed |
| Caddy / HTTPS | running, TLS issued |
| Next.js app | running |

## Worker
- **Was:** crash-looping — `Dynamic require of "punycode" is not supported`.
- **Now:** fixed in commit `c158c5f` (see WORKER_FIX_REPORT.md), verified by running
  the rebuilt bundle. **Pending redeploy** of the `worker` container on the VPS.

## Commands to capture authoritative live status (run on VPS)
```
docker ps
cd /opt/exploringtoknow/compose
docker compose --env-file ../env/.env --profile app ps
docker logs -n 100 etk-app
docker logs -n 100 etk-worker
docker logs -n 100 etk-caddy
docker exec etk-postgres pg_isready -U etk -d exploringtoknow
curl -s https://exploringtoknow.com/api/health
curl -s -o /dev/null -w "%{http_code}\n" https://exploringtoknow.com/admin
ROOT=/opt/exploringtoknow bash /root/etk-infra/server/verify-app.sh   # writes APP_DEPLOYMENT_REPORT.md
```

## Scope guardrails (unchanged)
No UI redesign yet · no social automation · no video generation · no real AI
generation until explicitly approved. Master Blueprint preserved.
