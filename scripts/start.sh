#!/bin/sh
set -e

# Wait for DB connection if necessary (optional improvement)
# echo "Waiting for database..."

# Run database migrations
# Find bun executable
BUN_BIN="bun"
if [ -f "/root/.bun/bin/bun" ]; then
    BUN_BIN="/root/.bun/bin/bun"
elif [ -f "/usr/local/bin/bun" ]; then
    BUN_BIN="/usr/local/bin/bun"
elif [ -f "/usr/bin/bun" ]; then
    BUN_BIN="/usr/bin/bun"
fi

echo "Using Bun at: $BUN_BIN"

# Run database migrations
echo "Applying database schema (db push)..."
$BUN_BIN run db:push --accept-data-loss

# Start the application
echo "Starting application with Bun..."
exec $BUN_BIN run start
