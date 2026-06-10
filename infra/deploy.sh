#!/usr/bin/env bash
# ExploringToKnow — ONE-COMMAND infrastructure deploy, run FROM YOUR WORKSTATION.
# Ships infra/ to the VPS, runs provisioning 00→10→20→30 + verify, pulls the report back.
# Does NOT deploy the app (app profile stays off).
#
#   VPS="root@YOUR_VPS_IP" DOMAIN=exploringtoknow.com bash infra/deploy.sh
#   (optional) SSH_KEY=~/.ssh/id_ed25519  DEPLOY_USER=deploy
set -euo pipefail
: "${VPS:?set VPS=user@host (e.g. root@1.2.3.4)}"
DOMAIN="${DOMAIN:-exploringtoknow.com}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
ROOT="${ROOT:-/opt/exploringtoknow}"
SSH=(ssh -o StrictHostKeyChecking=accept-new); SCP=(scp -o StrictHostKeyChecking=accept-new)
[ -n "${SSH_KEY:-}" ] && { SSH+=(-i "$SSH_KEY"); SCP+=(-i "$SSH_KEY"); }
HERE="$(cd "$(dirname "$0")" && pwd)"
run(){ echo "+ ssh $VPS: $*"; "${SSH[@]}" "$VPS" "$@"; }

echo "==> [1/6] ship infra/ to $VPS:/root/etk-infra"
run 'rm -rf /root/etk-infra && mkdir -p /root/etk-infra'
"${SCP[@]}" -r "$HERE"/. "$VPS":/root/etk-infra/

echo "==> [2/6] Docker + Compose"
run "DEPLOY_USER=$DEPLOY_USER bash /root/etk-infra/server/00-bootstrap-docker.sh"

echo "==> [3/6] firewall + fail2ban + hardening"
run "DEPLOY_USER=$DEPLOY_USER bash /root/etk-infra/server/10-harden.sh"

echo "==> [4/6] directory structure"
run "DEPLOY_USER=$DEPLOY_USER ROOT=$ROOT bash /root/etk-infra/server/20-structure.sh"

echo "==> [5/6] PostgreSQL + Caddy (NO app)"
run "ROOT=$ROOT bash /root/etk-infra/server/30-postgres.sh"

echo "==> [6/6] verify + fetch report"
run "DOMAIN=$DOMAIN ROOT=$ROOT OUT=/root/DEPLOYMENT_VERIFICATION_REPORT.md bash /root/etk-infra/server/verify.sh" || true
"${SCP[@]}" "$VPS":/root/DEPLOYMENT_VERIFICATION_REPORT.md ./DEPLOYMENT_VERIFICATION_REPORT.md || true
echo
echo "DONE. Report saved locally as DEPLOYMENT_VERIFICATION_REPORT.md"
echo "App NOT deployed (by design). Review the report, then approve the app-deploy phase."
