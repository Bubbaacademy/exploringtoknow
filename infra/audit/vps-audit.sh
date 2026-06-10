#!/usr/bin/env bash
# ExploringToKnow — VPS readiness audit. Run ON the Ubuntu 24.04 VPS (or via ssh).
# Read-only. Usage: DOMAIN=exploringtoknow.com bash vps-audit.sh
set -uo pipefail
DOMAIN="${DOMAIN:-exploringtoknow.com}"
ok(){ echo "PASS  $1"; }; warn(){ echo "WARN  $1"; }; bad(){ echo "FAIL  $1"; }
have(){ command -v "$1" >/dev/null 2>&1; }

echo "### OS / HOST"
. /etc/os-release 2>/dev/null || true
echo "OS: ${PRETTY_NAME:-unknown}"
case "${VERSION_ID:-}" in 24.04) ok "Ubuntu 24.04";; *) warn "expected Ubuntu 24.04, found ${VERSION_ID:-?}";; esac
echo "Kernel: $(uname -r)"
echo "CPU cores: $(nproc)  |  RAM: $(free -h | awk '/Mem:/{print $2}')  |  Disk free: $(df -h / | awk 'NR==2{print $4}')"
SWAP=$(free -m | awk '/Swap:/{print $2}'); [ "${SWAP:-0}" -gt 0 ] && ok "swap ${SWAP}MB" || warn "no swap configured"

echo; echo "### TOOLCHAIN"
have docker && { docker info >/dev/null 2>&1 && ok "docker running ($(docker --version|awk '{print $3}'|tr -d ,))" || warn "docker installed, daemon down"; } || warn "docker NOT installed (Phase B installs it)"
docker compose version >/dev/null 2>&1 && ok "compose plugin present" || warn "compose plugin NOT installed"
have git && ok "git present" || warn "git not installed"
have ufw && ok "ufw present ($(ufw status 2>/dev/null | head -1))" || warn "ufw not installed"
have fail2ban-client && ok "fail2ban present" || warn "fail2ban not installed"

echo; echo "### NETWORK / DNS"
PUBIP=$(curl -fsS --max-time 8 https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')
echo "VPS public IP (detected): ${PUBIP:-unknown}"
if have dig; then
  ARES=$(dig +short A "$DOMAIN" @1.1.1.1 2>/dev/null | tail -1)
  echo "DNS A ${DOMAIN}: ${ARES:-<none>}"
  if [ -n "$ARES" ] && [ "$ARES" = "$PUBIP" ]; then ok "DNS A points at this VPS"; \
  elif [ -n "$ARES" ]; then warn "DNS A ($ARES) != VPS IP ($PUBIP) — propagation/record mismatch"; \
  else warn "no A record yet for $DOMAIN"; fi
else warn "dig not installed (apt-get install -y dnsutils to check DNS)"; fi
for p in 22 80 443; do
  (exec 3<>/dev/tcp/127.0.0.1/$p) 2>/dev/null && { echo "port $p: listening"; exec 3>&- ; } || echo "port $p: free"
done
