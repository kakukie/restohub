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
# Uses prisma migrate deploy — safe for production:
# - Only applies pending migrations
# - Never drops data
# - Works with Supabase (reads DATABASE_URL & DIRECT_URL from env)
echo "Running database migrations..."

if [ -n "$BUN_BIN" ]; then
    export PATH="$(dirname $BUN_BIN):$PATH"
    "$BUN_BIN" x prisma migrate deploy
elif [ -n "$NPX_BIN" ]; then
    "$NPX_BIN" prisma migrate deploy
else
    echo "CRITICAL ERROR: Neither Bun nor Npx found. Cannot run migrations."
    exit 1
fi

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
