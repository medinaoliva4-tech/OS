#!/bin/sh
set -e

# ---------------------------------------------------------------------------
# Refuse to boot with a placeholder secret. A signed session cookie is only
# worth something if the key signing it is not public.
# ---------------------------------------------------------------------------
case "${AUTH_SECRET:-}" in
  ""|dev-only-secret*|build-time-placeholder*|change-me*)
    echo "FATAL: AUTH_SECRET is unset or still a placeholder."
    echo "       Generate one with:"
    echo "       node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    exit 1
    ;;
esac

if [ -z "${DATABASE_URL:-}" ]; then
  echo "FATAL: DATABASE_URL is not set."
  exit 1
fi

# ---------------------------------------------------------------------------
# Provision the database. The "is this the first boot?" test is derived from
# DATABASE_URL rather than hardcoded, so pointing the app at a different file
# — or at Postgres — still behaves correctly.
# ---------------------------------------------------------------------------
needs_seed=0

case "$DATABASE_URL" in
  file:*)
    db_path=$(printf '%s' "$DATABASE_URL" | sed 's|^file:||')
    # Relative sqlite paths resolve against prisma/, matching the Prisma CLI.
    case "$db_path" in
      /*) ;;
      *) db_path="/app/prisma/$db_path" ;;
    esac
    mkdir -p "$(dirname "$db_path")"
    [ -f "$db_path" ] || needs_seed=1
    ;;
  *)
    # A remote database: seed only when the schema has not been created yet.
    if ! npx prisma db execute --stdin >/dev/null 2>&1 <<'SQL'
SELECT 1 FROM "User" LIMIT 1;
SQL
    then
      needs_seed=1
    fi
    ;;
esac

if [ "$needs_seed" -eq 1 ]; then
  echo "First boot — creating the schema and seeding the founding team."
  npx prisma db push --skip-generate --accept-data-loss
  npx tsx prisma/seed.ts
else
  echo "Existing database — applying any schema changes."
  npx prisma db push --skip-generate
fi

exec "$@"
