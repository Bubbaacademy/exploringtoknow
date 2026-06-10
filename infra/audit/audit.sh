#!/usr/bin/env bash
# ExploringToKnow — infrastructure audit orchestrator.
# Runs the LOCAL audit, optionally the VPS audit over SSH, checks DNS, and writes
# INFRA_READINESS_REPORT.md.
#   DOMAIN=exploringtoknow.com VPS="deploy@your.vps.ip" bash infra/audit/audit.sh
set -uo pipefail
DOMAIN="${DOMAIN:-exploringtoknow.com}"
VPS="${VPS:-}"; SSH_KEY="${SSH_KEY:-}"
OUT="INFRA_READINESS_REPORT.md"
SSH_OPTS=(-o ConnectTimeout=8 -o StrictHostKeyChecking=accept-new)
[ -n "$SSH_KEY" ] && SSH_OPTS+=(-i "$SSH_KEY")
here="$(cd "$(dirname "$0")" && pwd)"

{
  echo "# Infrastructure Readiness Report"
  echo
  echo "Domain: **$DOMAIN** · Generated: $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  echo
  echo "## Local workstation"
  echo '```'
  bash "$here/local-audit.sh"
  echo '```'
  echo
  echo "## DNS"
  echo '```'
  if command -v dig >/dev/null 2>&1; then
    echo "A  $DOMAIN : $(dig +short A "$DOMAIN" 2>/dev/null | tr '\n' ' ')"
    echo "A  www.$DOMAIN : $(dig +short A "www.$DOMAIN" 2>/dev/null | tr '\n' ' ')"
  else echo "dig not available locally"; fi
  echo '```'
  echo
  echo "## VPS"
  if [ -n "$VPS" ]; then
    echo '```'
    ssh "${SSH_OPTS[@]}" "$VPS" 'bash -s' < "$here/vps-audit.sh" DOMAIN="$DOMAIN" 2>&1 \
      || echo "FAIL  could not SSH to $VPS"
    echo '```'
  else
    echo "_VPS not audited — set VPS=\"user@host\" to include it._"
  fi
  echo
  echo "## Readiness verdict"
  echo "- [ ] Local toolchain ready"
  echo "- [ ] SSH to VPS works"
  echo "- [ ] DNS A record → VPS IP (required before TLS issuance)"
  echo "- [ ] Docker + Compose on VPS (Phase B installs)"
  echo "- [ ] Firewall + hardening applied (Phase B)"
} | tee "$OUT"
echo "wrote $OUT"
