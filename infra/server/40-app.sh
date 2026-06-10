#!/usr/bin/env bash
# ExploringToKnow — APP PHASE deploy (run on the VPS as the deploy user, AFTER
# 00-30 infra is up). Builds images, runs migrations, starts app + worker behind
# the `app` compose profile, and waits for health. Idempotent.
#   ROOT=/opt/exploringtoknow bash 40-app.sh
set -euo pipefail
ROOT="${ROOT:-/opt/exploringtoknow}"
ENV="$ROOT/env/.env"
cd "$ROOT/compose"

echo "== preflight: required app env present? =="
for k in DATABASE_URL PAYLOAD_SECRET AUTH_SECRET PAYLOAD_PUBLIC_SERVER_URL; do
  grep -qE "^${k}=.+" "$ENV" || { echo "FAIL: $k missing/empty in $ENV"; exit 1; }
done
grep -qE "^ANTHROPIC_API_KEY=.+" "$ENV" || echo "WARN: ANTHROPIC_API_KEY empty (content generation will run in mock mode)"

echo "== build images =="
docker compose --env-file "$ENV" --profile app build

echo "== run migrations (one-shot) =="
docker compose --env-file "$ENV" --profile app run --rm migrate

echo "== start app + worker =="
docker compose --env-file "$ENV" --profile app up -d app worker

echo "== wait for app health =="
for i in $(seq 1 40); do
  st=$(docker inspect -f '{{.State.Health.Status}}' etk-app 2>/dev/null || echo starting)
  [ "$st" = healthy ] && { echo "app healthy"; break; }
  sleep 3
done
docker compose --env-file "$ENV" --profile app ps
echo "OK: app phase up. Caddy now serves https://$(grep ^DOMAIN "$ENV"|cut -d= -f2)"
