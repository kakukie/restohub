-- Migration: add_subscription_payment
-- Idempotent: safe to re-run if partially applied

-- CreateEnum (safe if already exists)
DO $$ BEGIN
    CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable (safe if already exists)
CREATE TABLE IF NOT EXISTS "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "proofImageUrl" TEXT,
    "notes" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey (safe if already exists)
DO $$ BEGIN
    ALTER TABLE "SubscriptionPayment"
        ADD CONSTRAINT "SubscriptionPayment_restaurantId_fkey"
        FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
