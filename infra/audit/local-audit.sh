#!/usr/bin/env bash
# ExploringToKnow — LOCAL workstation audit (run on your dev machine).
# Read-only. Prints PASS/WARN/FAIL lines; exit 0 always.
set -uo pipefail
ok(){ echo "PASS  $1"; }; warn(){ echo "WARN  $1"; }; bad(){ echo "FAIL  $1"; }
have(){ command -v "$1" >/dev/null 2>&1; }

echo "### LOCAL DEV ENVIRONMENT"
have node && ok "node $(node -v)" || bad "node not installed"
have pnpm && ok "pnpm $(pnpm -v)" || { have corepack && warn "pnpm via corepack (run: corepack enable)" || warn "pnpm not found"; }
have git  && ok "git $(git --version | awk '{print $3}')" || bad "git not installed"
have ssh  && ok "ssh client present" || bad "ssh client missing"
if have docker; then
  if docker info >/dev/null 2>&1; then ok "docker running ($(docker --version|awk '{print $3}'|tr -d ,))"; else warn "docker installed but daemon not running"; fi
  docker compose version >/dev/null 2>&1 && ok "docker compose plugin present" || warn "docker compose plugin missing"
else warn "docker not installed locally (only required if you build images locally)"; fi
[ -f .env ] && ok ".env present" || warn ".env not present (copy from .env.example)"
echo
echo "### REPO"
[ -f package.json ] && ok "monorepo root found" || warn "run from the repo root"
