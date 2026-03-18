-- Add free trial expiry column
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "freeTrialEndsAt" TIMESTAMP;
