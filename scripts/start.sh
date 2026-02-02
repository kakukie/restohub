#!/bin/sh
set -e

# Wait for DB connection if necessary (optional improvement)
# echo "Waiting for database..."

# Run database migrations
echo "Applying database schema (db push)..."
bun run db:push --accept-data-loss

# Start the application
echo "Starting application with Bun..."
exec bun run start
