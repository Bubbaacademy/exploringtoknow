#!/usr/bin/env bash
# Create the production directory structure under /opt/exploringtoknow. Idempotent.
# Run as root on the VPS.
set -euo pipefail
DEPLOY_USER="${DEPLOY_USER:-deploy}"
ROOT="${ROOT:-/opt/exploringtoknow}"

mkdir -p "$ROOT"/{compose,caddy,env,backups,postgres-data,logs}
# place infra files if this repo is checked out next to the script
SRC="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$SRC/docker-compose.prod.yml" ] && cp -n "$SRC/docker-compose.prod.yml" "$ROOT/compose/docker-compose.yml"
[ -f "$SRC/Caddyfile" ]               && cp -n "$SRC/Caddyfile" "$ROOT/caddy/Caddyfile"
[ -f "$SRC/.env.prod.example" ]       && cp -n "$SRC/.env.prod.example" "$ROOT/env/.env.example"

id "$DEPLOY_USER" >/dev/null 2>&1 && chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$ROOT"
chmod 700 "$ROOT/env" "$ROOT/backups"
echo "structure ready at $ROOT:"
find "$ROOT" -maxdepth 2 -type d | sort
echo "OK: structure complete"
