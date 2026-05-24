-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('uploaded', 'extracting', 'extracted', 'failed', 'needs_review');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('groceries', 'dining', 'transport', 'software', 'entertainment', 'utilities', 'household', 'health', 'travel', 'other');

-- CreateEnum
CREATE TYPE "SubscriptionInterval" AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled', 'unconfirmed');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('cheaper_alternative', 'subscription_waste', 'spending_spike', 'optimization_tip');

-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('new', 'seen', 'dismissed', 'actioned');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('success', 'partial', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT,
    "rawMerchant" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "imageMime" TEXT NOT NULL,
    "imageBytes" INTEGER NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'uploaded',
    "total" DECIMAL(12,2),
    "subtotal" DECIMAL(12,2),
    "tax" DECIMAL(12,2),
    "tip" DECIMAL(12,2),
    "currency" TEXT,
    "purchasedAt" TIMESTAMP(3),
    "paymentLast4" TEXT,
    "fieldConfidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "category" "ItemCategory",
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "interval" "SubscriptionInterval" NOT NULL,
    "firstCharge" TIMESTAMP(3) NOT NULL,
    "lastCharge" TIMESTAMP(3) NOT NULL,
    "nextChargeEstimate" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "sourceReceiptIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedSavings" DECIMAL(12,2),
    "currency" TEXT,
    "action" JSONB,
    "status" "InsightStatus" NOT NULL DEFAULT 'new',
    "sourceReceiptIds" TEXT[],
    "sourceSubscriptionId" TEXT,
    "modelVersion" TEXT,
    "promptVersion" TEXT,
    "contentFingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionAttempt" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "rawJson" JSONB NOT NULL,
    "status" "ExtractionStatus" NOT NULL,
    "errorMessage" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "costUsdEstimate" DECIMAL(10,4),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_canonicalName_key" ON "Merchant"("canonicalName");

-- CreateIndex
CREATE INDEX "Receipt_userId_purchasedAt_idx" ON "Receipt"("userId", "purchasedAt");

-- CreateIndex
CREATE INDEX "Receipt_userId_status_idx" ON "Receipt"("userId", "status");

-- CreateIndex
CREATE INDEX "Receipt_merchantId_idx" ON "Receipt"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_userId_imageHash_key" ON "Receipt"("userId", "imageHash");

-- CreateIndex
CREATE INDEX "Item_receiptId_idx" ON "Item"("receiptId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_receiptId_lineNumber_key" ON "Item"("receiptId", "lineNumber");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE INDEX "Subscription_merchantId_idx" ON "Subscription"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_merchantId_interval_key" ON "Subscription"("userId", "merchantId", "interval");

-- CreateIndex
CREATE INDEX "Insight_userId_type_status_idx" ON "Insight"("userId", "type", "status");

-- CreateIndex
CREATE INDEX "Insight_userId_status_createdAt_idx" ON "Insight"("userId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Insight_userId_contentFingerprint_key" ON "Insight"("userId", "contentFingerprint");

-- CreateIndex
CREATE INDEX "ExtractionAttempt_receiptId_createdAt_idx" ON "ExtractionAttempt"("receiptId", "createdAt");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionAttempt" ADD CONSTRAINT "ExtractionAttempt_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
