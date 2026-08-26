CREATE TABLE "EnergySite" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "country" TEXT,
  "timezone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EnergySite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EnergyAsset" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "capacityMw" DECIMAL(24,9),
  "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "resourceVersion" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EnergyAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IotDevice" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "manufacturer" TEXT,
  "model" TEXT,
  "serialNumber" TEXT,
  "firmwareVersion" TEXT,
  "connectivity" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "lastSeenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IotDevice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TelemetryReading" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "value" DECIMAL(38,12) NOT NULL,
  "unit" TEXT NOT NULL,
  "quality" TEXT NOT NULL DEFAULT 'GOOD',
  "source" TEXT NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TelemetryReading_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DepinNode" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "siteId" TEXT,
  "network" TEXT NOT NULL,
  "nodeType" TEXT NOT NULL,
  "operatorId" TEXT,
  "region" TEXT,
  "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
  "identityReference" TEXT,
  "lastHeartbeatAt" TIMESTAMP(3),
  "rewardAsset" TEXT,
  "rewardAmountBaseUnits" DECIMAL(78,0),
  "rewardDecimals" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DepinNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SafeAction" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "summary" JSONB NOT NULL,
  "state" TEXT NOT NULL,
  "policyReasons" JSONB NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "expectedResourceVersion" INTEGER,
  "resourceVersion" INTEGER NOT NULL DEFAULT 1,
  "confirmationTokenHash" TEXT,
  "confirmationExpiresAt" TIMESTAMP(3),
  "externalReference" TEXT,
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SafeAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EnergySite_organizationId_idx" ON "EnergySite"("organizationId");
CREATE INDEX "EnergyAsset_organizationId_siteId_idx" ON "EnergyAsset"("organizationId", "siteId");
CREATE INDEX "IotDevice_organizationId_siteId_idx" ON "IotDevice"("organizationId", "siteId");
CREATE INDEX "TelemetryReading_organizationId_deviceId_metric_observedAt_idx"
  ON "TelemetryReading"("organizationId", "deviceId", "metric", "observedAt");
CREATE INDEX "DepinNode_organizationId_network_idx" ON "DepinNode"("organizationId", "network");
CREATE UNIQUE INDEX "SafeAction_organizationId_idempotencyKey_key"
  ON "SafeAction"("organizationId", "idempotencyKey");
CREATE INDEX "SafeAction_organizationId_state_idx"
  ON "SafeAction"("organizationId", "state");

ALTER TABLE "EnergyAsset"
  ADD CONSTRAINT "EnergyAsset_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "EnergySite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IotDevice"
  ADD CONSTRAINT "IotDevice_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "EnergySite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TelemetryReading"
  ADD CONSTRAINT "TelemetryReading_deviceId_fkey"
  FOREIGN KEY ("deviceId") REFERENCES "IotDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DepinNode"
  ADD CONSTRAINT "DepinNode_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "EnergySite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
