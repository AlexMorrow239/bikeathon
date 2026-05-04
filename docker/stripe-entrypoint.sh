#!/usr/bin/env sh
set -eu

# Locks the containerized Stripe CLI to whichever account STRIPE_API_KEY belongs to,
# regardless of the host's `stripe login` state. See "Stripe account fixity" in the
# plan: no host config is mounted, --api-key is always passed explicitly, and the
# device name is fixed so the per-device webhook signing secret stays stable.

log() { echo "[stripe-entrypoint] $*"; }

if [ -z "${STRIPE_API_KEY:-}" ]; then
  log "ERROR: STRIPE_API_KEY is not set. Refusing to start (avoiding ambient-credential fallback)."
  exit 1
fi

DEVICE_NAME="${STRIPE_DEVICE_NAME:-bikeathon-docker-dev}"
FORWARD_TO="${FORWARD_TO:-http://app:3000/api/webhooks/stripe}"
SECRET_FILE="${SECRET_FILE:-/shared/stripe_webhook_secret}"

mkdir -p "$(dirname "$SECRET_FILE")"

# Optional account guard: verify STRIPE_API_KEY belongs to EXPECTED_STRIPE_ACCOUNT_ID.
# Uses BusyBox wget (already in the alpine-based stripe-cli image).
if [ -n "${EXPECTED_STRIPE_ACCOUNT_ID:-}" ]; then
  log "Verifying Stripe account against EXPECTED_STRIPE_ACCOUNT_ID=${EXPECTED_STRIPE_ACCOUNT_ID}..."
  ACCOUNT_JSON=$(wget -q -O- \
    --header="Authorization: Bearer ${STRIPE_API_KEY}" \
    "https://api.stripe.com/v1/account" 2>/dev/null || true)
  ACTUAL_ID=$(echo "$ACCOUNT_JSON" \
    | grep -oE '"id":[[:space:]]*"acct_[A-Za-z0-9]+"' \
    | head -1 \
    | grep -oE 'acct_[A-Za-z0-9]+')
  if [ -z "$ACTUAL_ID" ]; then
    log "ERROR: could not retrieve account info from Stripe API. STRIPE_API_KEY likely invalid."
    exit 1
  fi
  if [ "$ACTUAL_ID" != "$EXPECTED_STRIPE_ACCOUNT_ID" ]; then
    log "ERROR: STRIPE_API_KEY belongs to ${ACTUAL_ID}, not expected ${EXPECTED_STRIPE_ACCOUNT_ID}. Aborting."
    exit 1
  fi
  log "Account verified: ${ACTUAL_ID}."
fi

log "Capturing webhook signing secret (one-shot --print-secret)..."
SECRET=$(stripe listen \
  --api-key "$STRIPE_API_KEY" \
  --device-name "$DEVICE_NAME" \
  --print-secret)

if [ -z "$SECRET" ] || ! echo "$SECRET" | grep -qE '^whsec_'; then
  log "ERROR: failed to obtain webhook signing secret. Output was: ${SECRET}"
  exit 1
fi

echo "$SECRET" > "$SECRET_FILE"
log "Wrote signing secret to ${SECRET_FILE}."

log "Starting long-running listener -> ${FORWARD_TO} (device: ${DEVICE_NAME})..."
exec stripe listen \
  --api-key "$STRIPE_API_KEY" \
  --device-name "$DEVICE_NAME" \
  --forward-to "$FORWARD_TO"
