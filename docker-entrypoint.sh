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

[ -n "${DATABASE_URL:-}" ] || { echo "FATAL: DATABASE_URL is not set."; exit 1; }
# Migrations need the unpooled connection; fall back when they are the same.
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

echo "Applying migrations."
npx prisma migrate deploy

# Seed only an empty database. A restart must never touch existing rows, and a
# check that fails to run must stop the boot rather than guess.
set +e
npx tsx scripts/is-empty.ts
empty=$?
set -e

case "$empty" in
  0) echo "Seeding the founding team."; npx tsx prisma/seed.ts ;;
  1) echo "Existing data — leaving it alone." ;;
  *) echo "FATAL: could not determine database state; refusing to start."; exit 1 ;;
esac

exec "$@"
