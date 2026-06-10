#!/usr/bin/env bash
# Baseline security hardening for Ubuntu 24.04. Run as root on the VPS.
# SAFETY: keep your current SSH session OPEN while running this. The SSH-hardening
# step only disables password/root login if a key-based login for $DEPLOY_USER exists.
set -euo pipefail
DEPLOY_USER="${DEPLOY_USER:-deploy}"
SSH_PORT="${SSH_PORT:-22}"
export DEBIAN_FRONTEND=noninteractive

echo "== packages: ufw, fail2ban, unattended-upgrades =="
apt-get update -y
apt-get install -y ufw fail2ban unattended-upgrades dnsutils

echo "== deploy user =="
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
fi
# copy root's authorized_keys to the deploy user if present (key-based access)
if [ -s /root/.ssh/authorized_keys ]; then
  install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
  install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /root/.ssh/authorized_keys "/home/$DEPLOY_USER/.ssh/authorized_keys"
fi

echo "== firewall (ufw) =="
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp" comment 'SSH'
ufw allow 80/tcp  comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
ufw status verbose

echo "== fail2ban (sshd jail) =="
cat > /etc/fail2ban/jail.d/sshd.local <<JAIL
[sshd]
enabled = true
port    = ${SSH_PORT}
maxretry = 5
bantime  = 1h
findtime = 10m
JAIL
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "== automatic security updates =="
dpkg-reconfigure -f noninteractive unattended-upgrades || true

echo "== swap (2G if none) =="
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "2G swap created"
fi

echo "== SSH hardening (GUARDED) =="
KEYS="/home/$DEPLOY_USER/.ssh/authorized_keys"
if [ -s "$KEYS" ]; then
  cat > /etc/ssh/sshd_config.d/99-hardening.conf <<SSHD
PermitRootLogin no
PasswordAuthentication no
ChallengeResponseAuthentication no
KbdInteractiveAuthentication no
X11Forwarding no
MaxAuthTries 3
SSHD
  if sshd -t; then systemctl reload ssh && echo "SSH hardened (root+password login disabled). Test a NEW session before closing this one!"; \
  else echo "sshd config test FAILED — not applying"; rm -f /etc/ssh/sshd_config.d/99-hardening.conf; fi
else
  echo "SKIP SSH hardening: no key-based access for $DEPLOY_USER. Add your public key to $KEYS first, then re-run."
fi
echo "OK: hardening complete"
