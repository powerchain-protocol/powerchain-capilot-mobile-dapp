-- PowerChain Operations hardening v1.0.0
-- Adds telemetry ingestion receipts, site digital twin snapshots, alarms,
-- append-only operational journal, and reusable evidence envelopes.

ALTER TABLE "TelemetryReading"
  ADD COLUMN IF NOT EXISTS "sourceSequence" DECIMAL(78,0),
  ADD COLUMN IF NOT EXISTS "payloadHash" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "isLate" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "TelemetryReading_organizationId_source_sourceSequence_idx"
ON "TelemetryReading"("organizationId", "source", "sourceSequence");

CREATE TABLE IF NOT EXISTS "TelemetryIngestionReceipt" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sourceSequence" DECIMAL(78,0) NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "observedAt" TIMESTAMPTZ NOT NULL,
  "receivedAt" TIMESTAMPTZ NOT NULL,
  "status" TEXT NOT NULL,
  "readingId" TEXT,
  "reasonCode" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TelemetryIngestionReceipt_site_fkey" FOREIGN KEY ("siteId") REFERENCES "EnergySite"("id") ON DELETE CASCADE,
  CONSTRAINT "TelemetryIngestionReceipt_device_fkey" FOREIGN KEY ("deviceId") REFERENCES "IotDevice"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "TelemetryIngestionReceipt_org_source_key_uq" ON "TelemetryIngestionReceipt"("organizationId","source","idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "TelemetryIngestionReceipt_org_device_source_seq_uq" ON "TelemetryIngestionReceipt"("organizationId","deviceId","source","sourceSequence");
CREATE INDEX IF NOT EXISTS "TelemetryIngestionReceipt_org_site_created_idx" ON "TelemetryIngestionReceipt"("organizationId","siteId","createdAt");

CREATE TABLE IF NOT EXISTS "OperationalAlarm" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "observedAt" TIMESTAMPTZ NOT NULL,
  "receivedAt" TIMESTAMPTZ NOT NULL,
  "sourceSequence" DECIMAL(78,0),
  "payloadHash" TEXT NOT NULL,
  "acknowledgedAt" TIMESTAMPTZ,
  "acknowledgedBy" TEXT,
  "resolvedAt" TIMESTAMPTZ,
  "resolvedBy" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperationalAlarm_site_fkey" FOREIGN KEY ("siteId") REFERENCES "EnergySite"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "OperationalAlarm_org_site_status_severity_idx" ON "OperationalAlarm"("organizationId","siteId","status","severity");
CREATE INDEX IF NOT EXISTS "OperationalAlarm_org_site_observed_idx" ON "OperationalAlarm"("organizationId","siteId","observedAt");

CREATE TABLE IF NOT EXISTS "OperationalEventJournal" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sourceSequence" DECIMAL(78,0),
  "payload" JSONB NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "observedAt" TIMESTAMPTZ NOT NULL,
  "receivedAt" TIMESTAMPTZ NOT NULL,
  "requestId" TEXT NOT NULL,
  "traceId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperationalEventJournal_site_fkey" FOREIGN KEY ("siteId") REFERENCES "EnergySite"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "OperationalEventJournal_org_site_created_idx" ON "OperationalEventJournal"("organizationId","siteId","createdAt");
CREATE INDEX IF NOT EXISTS "OperationalEventJournal_org_aggregate_created_idx" ON "OperationalEventJournal"("organizationId","aggregateType","aggregateId","createdAt");

CREATE OR REPLACE FUNCTION powerchain_operational_event_immutable()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'OperationalEventJournal is append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS operational_event_immutable_update ON "OperationalEventJournal";
CREATE TRIGGER operational_event_immutable_update BEFORE UPDATE OR DELETE ON "OperationalEventJournal"
FOR EACH ROW EXECUTE FUNCTION powerchain_operational_event_immutable();

CREATE TABLE IF NOT EXISTS "DigitalTwinSnapshot" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "asOf" TIMESTAMPTZ NOT NULL,
  "operationalState" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "authoritative" BOOLEAN NOT NULL,
  "emsState" JSONB NOT NULL,
  "iotHealth" JSONB NOT NULL,
  "depinHealth" JSONB NOT NULL,
  "alarmCounts" JSONB NOT NULL,
  "reasons" JSONB NOT NULL,
  "sourceWatermarks" JSONB NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DigitalTwinSnapshot_site_fkey" FOREIGN KEY ("siteId") REFERENCES "EnergySite"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "DigitalTwinSnapshot_org_site_asOf_idx" ON "DigitalTwinSnapshot"("organizationId","siteId","asOf");

CREATE TABLE IF NOT EXISTS "EvidenceEnvelopeRecord" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "classification" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "truthTier" TEXT NOT NULL,
  "validationState" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "observedAt" TIMESTAMPTZ NOT NULL,
  "receivedAt" TIMESTAMPTZ NOT NULL,
  "authoritative" BOOLEAN NOT NULL,
  "label" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvidenceEnvelopeRecord_site_fkey" FOREIGN KEY ("siteId") REFERENCES "EnergySite"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "EvidenceEnvelopeRecord_org_site_created_idx" ON "EvidenceEnvelopeRecord"("organizationId","siteId","createdAt");
CREATE INDEX IF NOT EXISTS "EvidenceEnvelopeRecord_contentHash_idx" ON "EvidenceEnvelopeRecord"("contentHash");
