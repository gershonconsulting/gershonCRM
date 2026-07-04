#!/usr/bin/env bash
# GershonCRM — Phase 2: Install runtime (run on VPS as `deploy`)
# Installs: Node 20 LTS, PostgreSQL 16, nginx, certbot, PM2
set -euo pipefail

echo "==> Updating package index"
sudo apt update

echo "==> Node.js 20 LTS"
if ! command -v node &> /dev/null || [[ "$(node -v)" != v20.* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
node -v && npm -v

echo "==> PostgreSQL 16 (official PGDG repo)"
if ! command -v psql &> /dev/null; then
  sudo install -d /usr/share/postgresql-common/pgdg
  sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail \
    https://www.postgresql.org/media/keys/ACCC4CF8.asc
  echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] \
https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | \
    sudo tee /etc/apt/sources.list.d/pgdg.list > /dev/null
  sudo apt update
  sudo apt install -y postgresql-16 postgresql-contrib-16
fi
psql --version
sudo systemctl enable --now postgresql

echo "==> nginx"
sudo apt install -y nginx
sudo systemctl enable --now nginx
nginx -v

echo "==> certbot"
sudo apt install -y certbot python3-certbot-nginx
certbot --version

echo "==> PM2"
command -v pm2 &> /dev/null || sudo npm install -g pm2
pm2 --version

echo ""
echo "==> Phase 2 complete:"
echo "    node:    $(node -v)"
echo "    psql:    $(psql --version | awk '{print $3}')"
echo "    nginx:   $(nginx -v 2>&1 | awk -F/ '{print $2}')"
echo "    pm2:     $(pm2 --version)"
echo "Next: docs/deploy/03-setup-database.md"
