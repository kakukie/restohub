#!/bin/sh
set -e

# Wait for DB connection if necessary (optional improvement)
# echo "Waiting for database..."

# Run database migrations
# Run database migrations
echo "Applying database schema (db push)..."
export PATH="/usr/local/bin:$PATH"
/usr/local/bin/bun run db:push --accept-data-loss

# Start the application
echo "Starting application with Bun..."
exec /usr/local/bin/bun run start
