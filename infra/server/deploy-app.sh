#!/usr/bin/env bash
# ExploringToKnow — SAFE app deploy (run on the VPS as the deploy user, after the
# repo working tree is updated to the target commit).
#
# Fixes the Phase-4 deploy fragility:
#   * Always rebuilds the app AND migrate images from current source (no silent
#     reuse of a stale cached image).
#   * Runs migrations as their OWN observable step with stdin detached
#     (`run --build -T </dev/null`) so the migrate container cannot swallow the
#     rest of a piped script and skip the app swap.
#   * Verifies the running app container's image == the freshly built image, and
#     FAILS LOUDLY if a stale image is still running.
#   * Reports the payload migration count before/after.
#
# Usage (on the VPS):
#   ROOT=/opt/exploringtoknow bash infra/server/deploy-app.sh
#   SKIP_MIGRATE=1 ROOT=/opt/exploringtoknow bash infra/server/deploy-app.sh   # app-only, no migration
set -euo pipefail

ROOT="${ROOT:-/opt/exploringtoknow}"
ENV="$ROOT/env/.env"
COMPOSE_DIR="$ROOT/compose"
[ -f "$ENV" ] || { echo "FATAL: env file not found at $ENV"; exit 1; }
cd "$COMPOSE_DIR"

PGUSER="$(grep -E '^POSTGRES_USER=' "$ENV" | cut -d= -f2)"
PGDB="$(grep -E '^POSTGRES_DB=' "$ENV" | cut -d= -f2)"
DC=(docker compose --env-file "$ENV" --profile app)
log(){ echo "[deploy $(date -u +%H:%M:%S)] $*"; }
migcount(){ docker exec etk-postgres psql -U "$PGUSER" -d "$PGDB" -t -A -c 'SELECT count(*) FROM payload_migrations' 2>/dev/null || echo "?"; }

OLD_APP_IMG="$(docker inspect -f '{{.Image}}' etk-app 2>/dev/null || echo none)"
log "current app image: $OLD_APP_IMG"

log "STEP 1/4 — build app + migrate images from current source"
"${DC[@]}" build app migrate
BUILT_IMG="$(docker image inspect -f '{{.Id}}' etk-web:latest)"
log "freshly built etk-web:latest = $BUILT_IMG"

if [ "${SKIP_MIGRATE:-0}" = "1" ]; then
  log "STEP 2/4 — SKIP_MIGRATE=1, skipping migrations"
else
  MIG_BEFORE="$(migcount)"
  log "STEP 2/4 — run migrations (fresh image, stdin detached). payload_migrations before=$MIG_BEFORE"
  "${DC[@]}" run --build -T --rm migrate </dev/null
  MIG_AFTER="$(migcount)"
  log "payload_migrations after=$MIG_AFTER"
fi

log "STEP 3/4 — recreate app container (force-recreate, no deps)"
"${DC[@]}" up -d --no-deps --force-recreate app

NEW_APP_IMG="$(docker inspect -f '{{.Image}}' etk-app)"
log "running app image after recreate: $NEW_APP_IMG"
if [ "$NEW_APP_IMG" != "$BUILT_IMG" ]; then
  log "FATAL: running app image ($NEW_APP_IMG) != freshly built image ($BUILT_IMG) — STALE IMAGE, aborting."
  exit 1
fi

log "STEP 4/4 — wait for health"
st=starting
for _ in $(seq 1 40); do
  st="$(docker inspect -f '{{.State.Health.Status}}' etk-app 2>/dev/null || echo starting)"
  [ "$st" = healthy ] && break
  sleep 3
done
[ "$st" = healthy ] || { log "FATAL: app did not become healthy (status=$st)"; exit 1; }

log "DONE — app healthy on freshly built image. Worker/Postgres/Caddy untouched."
