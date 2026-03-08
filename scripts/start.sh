#!/bin/sh
set -e

# === Runtime Detection ===
BUN_BIN=""
if [ -x "/root/.bun/bin/bun" ]; then
    BUN_BIN="/root/.bun/bin/bun"
elif [ -x "/home/bun/.bun/bin/bun" ]; then
    BUN_BIN="/home/bun/.bun/bin/bun"
elif command -v bun >/dev/null 2>&1; then
    BUN_BIN=$(command -v bun)
fi

NODE_BIN=$(command -v node || true)
NPX_BIN=$(command -v npx || true)

echo "=== Meenuin Startup ==="
echo "User: $(whoami)"
echo "Bun:  ${BUN_BIN:-Not Found}"
echo "Node: ${NODE_BIN:-Not Found}"
echo "========================"

# === Database Migration ===
# Pin prisma@6.11.1 to match package.json (v7 is a breaking change)
echo "Running database migrations (prisma@6.11.1)..."

if [ -n "$BUN_BIN" ]; then
    PRISMA_CMD="$BUN_BIN x prisma@6.11.1"
elif [ -n "$NPX_BIN" ]; then
    PRISMA_CMD="$NPX_BIN prisma@6.11.1"
else
    echo "CRITICAL ERROR: Neither Bun nor Npx found. Cannot run migrations."
    exit 1
fi

# Auto-resolve any previously failed migrations so deploy can proceed.
# This is needed when a migration was partially applied and left in a broken
# state (e.g., Prisma version mismatch caused mid-run failure).
# The || true ensures we continue even if there are no failed migrations.
echo "Resolving any failed migrations..."
$PRISMA_CMD migrate resolve --rolled-back 20260308_add_subscription_payment 2>/dev/null || true

# Apply all pending migrations
$PRISMA_CMD migrate deploy

echo "Migrations complete."

# === Start Application ===
if [ -n "$BUN_BIN" ]; then
    echo "Starting with Bun..."
    exec "$BUN_BIN" run start
elif [ -n "$NODE_BIN" ]; then
    echo "Starting with Node (Standalone)..."
    exec "$NODE_BIN" server.js
else
    echo "CRITICAL ERROR: No runtime found to start application."
    exit 1
fi
