#!/usr/bin/env bash
# ExploringToKnow — infrastructure VERIFICATION (run ON the VPS, as root or deploy).
# Read-only. Writes DEPLOYMENT_VERIFICATION_REPORT.md and prints it.
set -uo pipefail
DOMAIN="${DOMAIN:-exploringtoknow.com}"
ROOT="${ROOT:-/opt/exploringtoknow}"
OUT="${OUT:-/root/DEPLOYMENT_VERIFICATION_REPORT.md}"
ok(){ echo "PASS  $1"; }; warn(){ echo "WARN  $1"; }; bad(){ echo "FAIL  $1"; }
line(){ printf '%s\n' "$1"; }

PUBIP=$(curl -fsS --max-time 8 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')

{
line "# Deployment Verification Report — Infrastructure"
line ""
line "Host: $(hostname) · Public IP: ${PUBIP:-unknown} · $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
line ""
line '```'

# --- Docker ---
if docker info >/dev/null 2>&1; then ok "Docker daemon running ($(docker --version | awk '{print $3}' | tr -d ,))"; else bad "Docker daemon NOT running"; fi
docker compose version >/dev/null 2>&1 && ok "Compose plugin: $(docker compose version --short 2>/dev/null)" || bad "Compose plugin missing"

# --- Compose services ---
if [ -f "$ROOT/compose/docker-compose.yml" ]; then
  ( cd "$ROOT/compose" && docker compose --env-file "$ROOT/env/.env" ps 2>/dev/null ) || warn "compose ps failed"
fi

# --- PostgreSQL ---
PG_STATE=$(docker inspect -f '{{.State.Health.Status}}' etk-postgres 2>/dev/null || echo "absent")
case "$PG_STATE" in
  healthy) ok "PostgreSQL container healthy" ;;
  absent)  bad "PostgreSQL container not found" ;;
  *)       warn "PostgreSQL health: $PG_STATE" ;;
esac
docker exec etk-postgres pg_isready -U "$(grep -E '^POSTGRES_USER' "$ROOT/env/.env" 2>/dev/null | cut -d= -f2)" >/dev/null 2>&1 \
  && ok "pg_isready: accepting connections" || warn "pg_isready failed"

# --- DB NOT publicly exposed ---
PUB_PORTS=$(docker port etk-postgres 2>/dev/null)
if [ -z "$PUB_PORTS" ]; then ok "PostgreSQL has NO published host ports (private to compose network)"; \
else bad "PostgreSQL publishes ports to host: $PUB_PORTS"; fi
if ss -ltn 2>/dev/null | grep -qE '0\.0\.0\.0:5432|\*:5432|:::5432'; then bad "5432 is listening on a public interface"; \
else ok "5432 not listening on any public interface"; fi

# --- Caddy ---
CADDY_STATE=$(docker inspect -f '{{.State.Status}}' etk-caddy 2>/dev/null || echo "absent")
[ "$CADDY_STATE" = "running" ] && ok "Caddy container running" || bad "Caddy not running (state: $CADDY_STATE)"

# --- Ports 80/443 ---
for p in 80 443; do
  if ss -ltn 2>/dev/null | grep -qE "[:.]${p}\b"; then ok "port ${p} listening"; else warn "port ${p} not listening"; fi
done

# --- Firewall ---
if command -v ufw >/dev/null 2>&1; then
  ufw status | grep -qiE '(^|\s)(80|443)/tcp.*ALLOW' && ok "ufw allows 80/443" || warn "ufw 80/443 rule not found"
  ufw status | grep -qiE '(^|\s)22/tcp.*ALLOW' && ok "ufw allows 22 (SSH)" || warn "ufw SSH rule not found"
else warn "ufw not installed"; fi

# --- fail2ban ---
systemctl is-active --quiet fail2ban && ok "fail2ban active" || warn "fail2ban not active"

line '```'
line ""
line "## Verdict"
line "- Application (Next.js/Payload) is intentionally NOT deployed — \`app\` profile is off."
line "- TLS for ${DOMAIN} issues once DNS A → ${PUBIP:-this VPS} and the app is reachable."
} | tee "$OUT"
echo
echo "wrote $OUT"
