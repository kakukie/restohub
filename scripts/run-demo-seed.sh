#!/bin/bash
# =============================================================
# run-demo-seed.sh  —  Run demo seed against Supabase
#
# Usage:
#   chmod +x scripts/run-demo-seed.sh
#   ./scripts/run-demo-seed.sh
#
# Supabase requires DIRECT_URL (not pooled) for seeding.
# This script automatically uses DIRECT_URL as DATABASE_URL
# to bypass pgBouncer when running the seed.
# =============================================================

set -e

# Load .env file if it exists
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
    echo "✅ Loaded .env file"
elif [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
    echo "✅ Loaded .env.local file"
elif [ -f ".env.production" ]; then
    export $(grep -v '^#' .env.production | grep -v '^$' | xargs)
    echo "✅ Loaded .env.production file"
else
    echo "⚠️  No .env file found. Using existing environment variables."
fi

# For Supabase: override DATABASE_URL with DIRECT_URL (bypasses pgBouncer)
if [ -n "$DIRECT_URL" ]; then
    echo "🔀 Using DIRECT_URL for seeding (required for Supabase/pgBouncer)"
    export DATABASE_URL="$DIRECT_URL"
else
    echo "ℹ️  DIRECT_URL not set, using DATABASE_URL as-is"
fi

echo ""
echo "🌐 Database: $DATABASE_URL" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/'
echo ""

# Run the demo seed
echo "🌱 Running demo seed..."
npx tsx prisma/seed-demo.ts

echo ""
echo "✅ Done! Demo data has been seeded to Supabase."
