#!/usr/bin/env bash
# Creates the database and user on a fresh Ubuntu VPS (run with sudo).
set -euo pipefail
DB_PASS="${1:?Usage: sudo bash deploy/setup-postgres.sh <db-password>}"
command -v psql >/dev/null || { apt-get update && apt-get install -y postgresql; }
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'morrow') THEN
    CREATE ROLE morrow LOGIN PASSWORD '${DB_PASS}';
  END IF;
END \$\$;
SQL
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='morrow'" | grep -q 1 || sudo -u postgres createdb -O morrow morrow
echo "DATABASE_URL=\"postgresql://morrow:${DB_PASS}@localhost:5432/morrow?schema=public\""
