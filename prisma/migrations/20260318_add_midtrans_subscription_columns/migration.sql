-- Add Midtrans-related columns to SubscriptionPayment
ALTER TABLE "SubscriptionPayment"
    ADD COLUMN IF NOT EXISTS "orderId" TEXT,
    ADD COLUMN IF NOT EXISTS "snapToken" TEXT,
    ADD COLUMN IF NOT EXISTS "redirectUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "paymentType" TEXT,
    ADD COLUMN IF NOT EXISTS "paymentChannel" TEXT,
    ADD COLUMN IF NOT EXISTS "cycleMonths" INTEGER,
    ADD COLUMN IF NOT EXISTS "grossAmount" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "midtransStatus" TEXT,
    ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "expiredAt" TIMESTAMP;
