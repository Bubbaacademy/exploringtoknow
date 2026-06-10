#!/usr/bin/env bash
# Prepare (NOT app-deploy) the PostgreSQL container via compose. Generates a strong
# DB password into env on first run, brings up ONLY postgres + caddy, verifies DB.
# Run as the deploy user on the VPS.
set -euo pipefail
ROOT="${ROOT:-/opt/exploringtoknow}"
ENV="$ROOT/env/.env"
COMPOSE="$ROOT/compose/docker-compose.yml"

if [ ! -f "$ENV" ]; then
  cp "$ROOT/env/.env.example" "$ENV"
  PW="$(openssl rand -hex 24)"; SECRET="$(openssl rand -hex 32)"; AUTH="$(openssl rand -hex 32)"
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${PW}|" "$ENV"
  sed -i "s|^PAYLOAD_SECRET=.*|PAYLOAD_SECRET=${SECRET}|" "$ENV"
  sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=${AUTH}|" "$ENV"
  # sync DATABASE_URL password
  sed -i "s|\(postgres://[^:]*:\)[^@]*\(@.*\)|\1${PW}\2|" "$ENV"
  chmod 600 "$ENV"; echo "generated secrets into $ENV"
fi

cd "$ROOT/compose"
# bring up infra services only (postgres + reverse proxy); app is NOT deployed yet
docker compose --env-file "$ENV" up -d postgres caddy
echo "waiting for postgres health..."
for i in $(seq 1 30); do
  st=$(docker inspect -f '{{.State.Health.Status}}' etk-postgres 2>/dev/null || echo starting)
  [ "$st" = healthy ] && break; sleep 2
done
docker compose --env-file "$ENV" ps
docker exec etk-postgres pg_isready -U "$(grep ^POSTGRES_USER "$ENV"|cut -d= -f2)" && echo "OK: postgres ready"
echo "NOTE: app service is intentionally NOT started (no app deploy yet)."
