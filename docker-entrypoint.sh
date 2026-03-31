#!/bin/sh
set -e

if [ "$(id -u)" != "0" ]; then
  echo "Container must run as root (PostgreSQL init + su-exec for Node)."
  exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
  echo "DB_PASSWORD is required."
  exit 1
fi

mkdir -p /app/public/uploads/recipes
chown -R nextjs:nodejs /app/public/uploads

PGDATA=${PGDATA:-/var/lib/postgresql/data}
mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"

if [ ! -f "$PGDATA/PG_VERSION" ]; then
  su-exec postgres initdb -D "$PGDATA" -E UTF8 --locale=C
  echo "listen_addresses = '127.0.0.1'" >> "$PGDATA/postgresql.conf"
  echo "unix_socket_directories = '/tmp'" >> "$PGDATA/postgresql.conf"
  echo "host all all 127.0.0.1/32 trust" >> "$PGDATA/pg_hba.conf"
fi

su-exec postgres postgres -D "$PGDATA" &
PG_PID=$!

i=0
while ! pg_isready -h 127.0.0.1 -U postgres -q; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "PostgreSQL did not become ready in time."
    kill "$PG_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

PW_ESC=$(printf %s "$DB_PASSWORD" | sed "s/'/''/g")
if su-exec postgres psql -h 127.0.0.1 -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='homecrm'" | grep -q 1; then
  su-exec postgres psql -h 127.0.0.1 -d postgres -c "ALTER USER homecrm WITH PASSWORD '$PW_ESC'"
else
  su-exec postgres psql -h 127.0.0.1 -d postgres -c "CREATE USER homecrm WITH LOGIN PASSWORD '$PW_ESC'"
fi
if ! su-exec postgres psql -h 127.0.0.1 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='homecrm'" | grep -q 1; then
  su-exec postgres psql -h 127.0.0.1 -d postgres -c "CREATE DATABASE homecrm OWNER homecrm"
fi

PW_URL=$(node -e "console.log(encodeURIComponent(process.argv[1] || ''))" "$DB_PASSWORD")
export DATABASE_URL="postgresql://homecrm:${PW_URL}@127.0.0.1:5432/homecrm"

term() {
  kill -TERM "$NODE_PID" 2>/dev/null || true
  kill -TERM "$PG_PID" 2>/dev/null || true
  wait "$NODE_PID" 2>/dev/null || true
  wait "$PG_PID" 2>/dev/null || true
  exit 0
}
trap term INT TERM

echo "Syncing database schema (prisma db push)..."
su-exec nextjs node ./node_modules/prisma/build/index.js db push --skip-generate

echo "Starting application..."
su-exec nextjs node server.js &
NODE_PID=$!
wait "$NODE_PID"
RC=$?
kill -TERM "$PG_PID" 2>/dev/null || true
wait "$PG_PID" 2>/dev/null || true
exit "$RC"
