-- Add activeUntil column to Restaurant
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "activeUntil" TIMESTAMP;
