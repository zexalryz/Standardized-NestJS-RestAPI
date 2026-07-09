#!/bin/sh
set -e

# Run database setup (push schema + seed) on startup
npx prisma db push --accept-data-loss 2>&1
node prisma/seed.cjs 2>&1

exec "$@"
