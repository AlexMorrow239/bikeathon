#!/usr/bin/env bash
set -euo pipefail

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-bikeathon}"
SECRET_FILE="${SECRET_FILE:-/shared/stripe_webhook_secret}"
SECRET_TIMEOUT_SECONDS="${SECRET_TIMEOUT_SECONDS:-60}"

log() { echo "[app-entrypoint] $*"; }

log "Waiting for Postgres at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" >/dev/null 2>&1; do
  sleep 0.5
done
log "Postgres is ready."

log "Applying migrations (prisma migrate deploy)..."
bunx prisma migrate deploy

# Conditional seed: only seed when the DB has no athletes. prisma/seed.ts wipes
# existing rows before inserting, so unconditional seeding would clobber anything
# the dev added by hand.
log "Checking athlete count..."
ATHLETE_COUNT=$(PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "$POSTGRES_HOST" \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -tAc 'SELECT COUNT(*) FROM "Athlete";' | tr -d '[:space:]')

if [ "$ATHLETE_COUNT" = "0" ]; then
  log "DB has no athletes — running seed..."
  bun run db:seed
else
  log "DB has ${ATHLETE_COUNT} athletes — skipping seed."
fi

log "Waiting up to ${SECRET_TIMEOUT_SECONDS}s for Stripe webhook secret at ${SECRET_FILE}..."
ELAPSED=0
while [ ! -s "$SECRET_FILE" ] && [ "$ELAPSED" -lt "$SECRET_TIMEOUT_SECONDS" ]; do
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

if [ -s "$SECRET_FILE" ]; then
  STRIPE_WEBHOOK_SECRET="$(cat "$SECRET_FILE")"
  export STRIPE_WEBHOOK_SECRET
  log "Loaded STRIPE_WEBHOOK_SECRET from ${SECRET_FILE}."
else
  log "WARNING: ${SECRET_FILE} not populated within ${SECRET_TIMEOUT_SECONDS}s. Webhook signature verification will fail until container restart."
fi

log "Starting Next.js dev server..."
exec bun run dev
