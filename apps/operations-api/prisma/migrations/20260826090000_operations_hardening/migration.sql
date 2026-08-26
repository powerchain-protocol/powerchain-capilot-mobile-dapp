CREATE TABLE "SiteAccess" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'viewer', "permissions" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3), "revokedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SiteAccess_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SiteAccess_organizationId_userId_siteId_key" ON "SiteAccess"("organizationId","userId","siteId");
CREATE INDEX "SiteAccess_organizationId_userId_idx" ON "SiteAccess"("organizationId","userId");
CREATE INDEX "SiteAccess_siteId_idx" ON "SiteAccess"("siteId");
ALTER TABLE "SiteAccess" ADD CONSTRAINT "SiteAccess_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "EnergySite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WalletIdentity" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "userId" TEXT NOT NULL, "siteId" TEXT,
  "chain" TEXT NOT NULL, "address" TEXT NOT NULL, "label" TEXT, "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3), "revokedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "WalletIdentity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WalletIdentity_organizationId_chain_address_key" ON "WalletIdentity"("organizationId","chain","address");
CREATE INDEX "WalletIdentity_organizationId_userId_idx" ON "WalletIdentity"("organizationId","userId");
ALTER TABLE "WalletIdentity" ADD CONSTRAINT "WalletIdentity_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "EnergySite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SafeAction" ADD COLUMN "siteId" TEXT;
ALTER TABLE "SafeAction" ADD COLUMN "intentHash" TEXT;
ALTER TABLE "SafeAction" ADD COLUMN "traceId" TEXT;
ALTER TABLE "SafeAction" ADD COLUMN "expiresAt" TIMESTAMP(3);
UPDATE "SafeAction" SET "intentHash" = md5("id" || ':' || "idempotencyKey"), "traceId" = "requestId", "expiresAt" = COALESCE("confirmationExpiresAt", NOW()) WHERE "intentHash" IS NULL;
ALTER TABLE "SafeAction" ALTER COLUMN "intentHash" SET NOT NULL;
ALTER TABLE "SafeAction" ALTER COLUMN "traceId" SET NOT NULL;
ALTER TABLE "SafeAction" ALTER COLUMN "expiresAt" SET NOT NULL;
ALTER TABLE "SafeAction" DROP COLUMN "confirmationTokenHash";
ALTER TABLE "SafeAction" DROP COLUMN "confirmationExpiresAt";
ALTER TABLE "SafeAction" DROP COLUMN "externalReference";
ALTER TABLE "SafeAction" DROP COLUMN "errorCode";
CREATE INDEX "SafeAction_organizationId_siteId_idx" ON "SafeAction"("organizationId","siteId");

CREATE TABLE "OperationalOutbox" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "siteId" TEXT, "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL, "aggregateVersion" INTEGER NOT NULL, "eventType" TEXT NOT NULL,
  "schemaVersion" TEXT NOT NULL, "payload" JSONB NOT NULL, "requestId" TEXT NOT NULL, "traceId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL, "publishedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperationalOutbox_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OperationalOutbox_organizationId_occurredAt_idx" ON "OperationalOutbox"("organizationId","occurredAt");
CREATE INDEX "OperationalOutbox_publishedAt_occurredAt_idx" ON "OperationalOutbox"("publishedAt","occurredAt");
