#!/usr/bin/env bash
# Install Docker CE + Compose plugin on Ubuntu 24.04 (official apt repo). Idempotent.
# Run as root (or via sudo) on the VPS.
set -euo pipefail
DEPLOY_USER="${DEPLOY_USER:-deploy}"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "docker + compose already present: $(docker --version)"
else
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
  fi
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

systemctl enable --now docker
# allow the deploy user to run docker without sudo
if id "$DEPLOY_USER" >/dev/null 2>&1; then usermod -aG docker "$DEPLOY_USER" && echo "added $DEPLOY_USER to docker group (re-login to take effect)"; fi
docker --version; docker compose version
echo "OK: docker bootstrap complete"
