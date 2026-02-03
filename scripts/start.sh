#!/bin/sh
set -e

# Wait for DB connection if necessary (optional improvement)
# echo "Waiting for database..."

# Run database migrations
# === Runtime Detection ===
# Try to find Bun
BUN_BIN=""
if [ -x "/root/.bun/bin/bun" ]; then
    BUN_BIN="/root/.bun/bin/bun"
elif [ -x "/home/bun/.bun/bin/bun" ]; then
    BUN_BIN="/home/bun/.bun/bin/bun"
elif command -v bun >/dev/null 2>&1; then
    BUN_BIN=$(command -v bun)
fi

# Try to find Node/Npx
NODE_BIN=$(command -v node || true)
NPX_BIN=$(command -v npx || true)

echo "Detected Environment:"
echo "User: $(whoami)"
echo "Bun: ${BUN_BIN:-Not Found}"
echo "Node: ${NODE_BIN:-Not Found}"

# === Database Migration ===
echo "Applying database schema (db push)..."

if [ -n "$BUN_BIN" ]; then
    # Bun Environment
    export PATH="$(dirname $BUN_BIN):$PATH"
    "$BUN_BIN" run db:push --accept-data-loss
elif [ -n "$NPX_BIN" ]; then
    # Node Environment
    # Node Environment
    "$NPX_BIN" prisma@6.11.1 db push --accept-data-loss
else
    echo "CRITICAL ERROR: Neither Bun nor Npx found. Cannot migrate DB."
    exit 1
fi

# === Start Application ===
if [ -n "$BUN_BIN" ]; then 
    echo "Starting with Bun..."
    # Bun typically uses 'bun run start' which maps to package.json
    exec "$BUN_BIN" run start
elif [ -n "$NODE_BIN" ]; then
    echo "Starting with Node (Standalone)..."
    # Node environment (likely Next.js standalone)
    exec "$NODE_BIN" server.js
else
    echo "CRITICAL ERROR: No runtime found to start application."
    exit 1
fi
