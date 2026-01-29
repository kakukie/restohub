-- Migration: Generate slugs for existing restaurants
-- This updates all restaurants that have NULL or empty slugs

UPDATE "Restaurant"
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'),
    '^-+|-+$', '', 'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- Verify the update
SELECT id, name, slug FROM "Restaurant" ORDER BY "createdAt" DESC;
