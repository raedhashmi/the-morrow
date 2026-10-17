#!/usr/bin/env bash
# The Morrow — install, migrate, build and (re)start under PM2.
# Usage (on the server, inside the project folder):  bash deploy/deploy.sh
# Matches create-nextjs-domain.sh, which starts the app as: pm2 start npm --name <name> -- start -- --port <port>
set -euo pipefail
cd "$(dirname "$0")/.."

APP_NAME="${APP_NAME:-the-morrow}"
PORT="${PORT:-3010}"

[ -f .env ] || { echo "Missing .env — copy .env.example and fill it in."; exit 1; }
export GIT_SHA="${GIT_SHA:-$(git rev-parse HEAD 2>/dev/null || echo dev)}"

echo "→ Installing dependencies"
npm ci --no-audit --no-fund

echo "→ Applying database migrations"
set -a; source .env; set +a
npx prisma migrate deploy

echo "→ Building"
npm run build

command -v pm2 >/dev/null || npm i -g pm2
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  echo "→ Reloading PM2 process $APP_NAME"
  pm2 reload "$APP_NAME" --update-env
else
  echo "→ Starting PM2 process $APP_NAME on port $PORT"
  pm2 start npm --name "$APP_NAME" -- start -- --port "$PORT"
fi
pm2 save

echo "✓ The Morrow is running on 127.0.0.1:$PORT ($GIT_SHA)"
