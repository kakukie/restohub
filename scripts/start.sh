#!/bin/sh
set -e

# Wait for DB connection if necessary (optional improvement)
# echo "Waiting for database..."

# Run database migrations
echo "Generating Prisma Client..."
npx prisma@6.11.1 generate

echo "Applying database schema (db push)..."
npx prisma@6.11.1 db push --accept-data-loss

# Start the application
echo "Starting application..."
exec node server.js
