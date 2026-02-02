#!/bin/sh
set -e

# Wait for DB connection if necessary (optional improvement)
# echo "Waiting for database..."

# Run database migrations
# Debug User
echo "User: $(whoami) ($(id -u))"
echo "PATH: $PATH"

# Find Bun
BUN_BIN=""

# Check /usr/local/bin (Standard for Docker images)
if [ -x "/usr/local/bin/bun" ]; then
    BUN_BIN="/usr/local/bin/bun"
# Check /home/bun/.bun/bin (Standard for bun user)
elif [ -x "/home/bun/.bun/bin/bun" ]; then
    BUN_BIN="/home/bun/.bun/bin/bun"
# Check /root/.bun/bin (Only if root)
elif [ "$(id -u)" -eq 0 ] && [ -x "/root/.bun/bin/bun" ]; then
    BUN_BIN="/root/.bun/bin/bun"
# Check PATH
elif command -v bun >/dev/null 2>&1; then
    BUN_BIN=$(command -v bun)
fi

if [ -z "$BUN_BIN" ]; then
    echo "CRITICAL ERROR: Bun not found!"
    echo "Listing /usr/local/bin:"
    ls -la /usr/local/bin || echo "Cannot list /usr/local/bin"
    exit 1
fi

echo "Found Bun at: $BUN_BIN"

# Run database migrations
echo "Applying database schema (db push)..."
export PATH="$(dirname $BUN_BIN):$PATH"
"$BUN_BIN" run db:push --accept-data-loss

# Start the application
echo "Starting application with Bun..."
exec "$BUN_BIN" run start
