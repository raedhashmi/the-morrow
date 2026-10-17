#!/usr/bin/env bash
# The Morrow — build & (re)start on a VPS.
# Usage (on the server, inside the project folder):  bash deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

APP_NAME="${APP_NAME:-the-morrow}"
PORT="${PORT:-3010}"

[ -f .env ] || { echo "Missing .env — copy .env.example and fill it in."; exit 1; }

echo "→ Installing dependencies"
npm ci

echo "→ Generating Prisma client & applying migrations"
npx prisma generate
npx prisma migrate deploy

echo "→ Building"
npm run build

# Standalone output needs static assets copied alongside the server
cp -r public .next/standalone/ 2>/dev/null || true
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/

echo "→ Starting with PM2 on port $PORT"
command -v pm2 >/dev/null || npm i -g pm2
set -a; source .env; set +a
PORT="$PORT" HOSTNAME=127.0.0.1 pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save

echo "✓ The Morrow is running on 127.0.0.1:$PORT"
echo "  Next: point Nginx at it (deploy/nginx.conf) and add the cron line (deploy/crontab.txt)."
