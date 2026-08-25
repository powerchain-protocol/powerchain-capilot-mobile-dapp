CREATE TYPE "UserRole" AS ENUM ('USER', 'OPERATOR', 'ADMIN', 'SUPERADMIN');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETE');
CREATE TYPE "WalletNetwork" AS ENUM ('SOLANA');
CREATE TYPE "WalletType" AS ENUM ('EXTERNAL', 'EMBEDDED', 'READ_ONLY');
CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');
CREATE TYPE "MarketDataSource" AS ENUM ('PYTH', 'BIRDEYE');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "emailVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organization" TEXT,
  "jobTitle" TEXT,
  "country" TEXT,
  "timezone" TEXT,
  "interests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "preferences" JSONB,
  "onboardingStep" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wallet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "network" "WalletNetwork" NOT NULL DEFAULT 'SOLANA',
  "type" "WalletType" NOT NULL DEFAULT 'EXTERNAL',
  "address" TEXT NOT NULL,
  "label" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WalletChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "nonce" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiConversation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT,
  "context" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" "AiMessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "provider" TEXT,
  "model" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PriceSnapshot" (
  "id" TEXT NOT NULL,
  "source" "MarketDataSource" NOT NULL,
  "assetKey" TEXT NOT NULL,
  "symbol" TEXT,
  "mint" TEXT,
  "price" DECIMAL(38,18) NOT NULL,
  "confidence" DECIMAL(38,18),
  "exponent" INTEGER,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "requestId" TEXT,
  "correlationId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_onboardingStatus_idx" ON "User"("onboardingStatus");

CREATE UNIQUE INDEX "AccountProfile_userId_key" ON "AccountProfile"("userId");

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");
CREATE INDEX "Session_revokedAt_idx" ON "Session"("revokedAt");

CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");
CREATE INDEX "Wallet_userId_network_idx" ON "Wallet"("userId", "network");

CREATE UNIQUE INDEX "WalletChallenge_nonce_key" ON "WalletChallenge"("nonce");
CREATE INDEX "WalletChallenge_userId_address_idx" ON "WalletChallenge"("userId", "address");
CREATE INDEX "WalletChallenge_expiresAt_idx" ON "WalletChallenge"("expiresAt");

CREATE INDEX "AiConversation_userId_updatedAt_idx" ON "AiConversation"("userId", "updatedAt");
CREATE INDEX "AiMessage_conversationId_createdAt_idx" ON "AiMessage"("conversationId", "createdAt");
CREATE INDEX "PriceSnapshot_source_assetKey_observedAt_idx" ON "PriceSnapshot"("source", "assetKey", "observedAt");
CREATE INDEX "AuditEvent_userId_createdAt_idx" ON "AuditEvent"("userId", "createdAt");
CREATE INDEX "AuditEvent_resourceType_resourceId_idx" ON "AuditEvent"("resourceType", "resourceId");
CREATE INDEX "AuditEvent_requestId_idx" ON "AuditEvent"("requestId");

ALTER TABLE "AccountProfile"
  ADD CONSTRAINT "AccountProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Wallet"
  ADD CONSTRAINT "Wallet_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WalletChallenge"
  ADD CONSTRAINT "WalletChallenge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiConversation"
  ADD CONSTRAINT "AiConversation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiMessage"
  ADD CONSTRAINT "AiMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditEvent"
  ADD CONSTRAINT "AuditEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
