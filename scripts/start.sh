#!/bin/sh
set -e

# Wait for DB connection if necessary (optional improvement)
# echo "Waiting for database..."

# Run database push (Safe for prototyping/early production)
# For strict production with migrations, use 'prisma migrate deploy'
echo "Syncing database schema..."
npx prisma@6.11.1 db push --accept-data-loss

# Start the application
echo "Starting application..."
exec node server.js
