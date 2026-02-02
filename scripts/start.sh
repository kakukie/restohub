#!/bin/sh
set -e

# Wait for DB connection if necessary (optional improvement)
# echo "Waiting for database..."

# Run database migrations
# Export potential Bun paths
export PATH="/root/.bun/bin:/usr/local/bin:/usr/bin:$PATH"

# Debugging
echo "Current PATH: $PATH"
ls -la /root/.bun/bin/bun || echo "Bun not in /root/.bun/bin"

# Find bun
if command -v bun >/dev/null 2>&1; then
    BUN_BIN=$(command -v bun)
elif [ -f "/root/.bun/bin/bun" ]; then
    BUN_BIN="/root/.bun/bin/bun"
else
    echo "ERROR: Bun executable not found!"
    exit 1
fi

echo "Using Bun at: $BUN_BIN"

# Run database migrations
echo "Applying database schema (db push)..."
$BUN_BIN run db:push --accept-data-loss

# Start the application
echo "Starting application with Bun..."
exec $BUN_BIN run start
