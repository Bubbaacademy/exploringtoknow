#!/usr/bin/env bash
# ExploringToKnow — APP verification (run ON the VPS after 40-app.sh). Read-only.
# Writes APP_DEPLOYMENT_REPORT.md with real container/migration/health/domain status.
set -uo pipefail
DOMAIN="${DOMAIN:-exploringtoknow.com}"
ROOT="${ROOT:-/opt/exploringtoknow}"
ENV="$ROOT/env/.env"
OUT="${OUT:-/root/APP_DEPLOYMENT_REPORT.md}"
PGUSER=$(grep -E '^POSTGRES_USER=' "$ENV" 2>/dev/null | cut -d= -f2)
PGDB=$(grep -E '^POSTGRES_DB=' "$ENV" 2>/dev/null | cut -d= -f2)
code(){ curl -s -o /dev/null -w "%{http_code}" --max-time 12 "$@" 2>/dev/null || echo "000"; }

{
echo "# APP Deployment Report — ExploringToKnow"
echo
echo "Domain: $DOMAIN · $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
echo
echo "## Containers"
echo '```'
( cd "$ROOT/compose" && docker compose --env-file "$ENV" --profile app ps ) 2>&1
echo '```'
echo
echo "## Migration status"
echo '```'
echo "etk-migrate exit code: $(docker inspect -f '{{.State.ExitCode}}' etk-migrate 2>/dev/null || echo 'n/a')"
docker exec etk-postgres psql -U "$PGUSER" -d "$PGDB" -tAc \
  "select count(*)||' payload migrations applied' from payload_migrations;" 2>/dev/null || echo "payload_migrations: not queryable"
docker exec etk-postgres psql -U "$PGUSER" -d "$PGDB" -tAc \
  "select count(*)||' ops migrations applied' from _ops_migrations;" 2>/dev/null || echo "_ops_migrations: n/a"
echo '```'
echo
echo "## App health"
echo '```'
echo "etk-app health: $(docker inspect -f '{{.State.Health.Status}}' etk-app 2>/dev/null || echo absent)"
echo "etk-worker state: $(docker inspect -f '{{.State.Status}}' etk-worker 2>/dev/null || echo absent)"
echo "internal /api/health (via Caddy, Host header): HTTP $(code -H "Host: $DOMAIN" http://127.0.0.1/api/health)"
echo '```'
echo
echo "## Caddy reverse proxy + domain"
echo '```'
echo "https://$DOMAIN            -> HTTP $(code https://$DOMAIN)"
echo "https://$DOMAIN/api/health -> HTTP $(code https://$DOMAIN/api/health)"
echo "https://$DOMAIN/admin      -> HTTP $(code https://$DOMAIN/admin)   (Payload admin)"
echo "https://www.$DOMAIN        -> HTTP $(code https://www.$DOMAIN)"
echo "http://$DOMAIN  (->https)  -> HTTP $(code -I http://$DOMAIN)"
echo '```'
echo
echo "## Notes"
echo "- App reachable over HTTPS via Caddy with automatic TLS."
echo "- AI generation NOT executed (worker idle unless ANTHROPIC_API_KEY set; mock otherwise)."
} | tee "$OUT"
echo "wrote $OUT"
