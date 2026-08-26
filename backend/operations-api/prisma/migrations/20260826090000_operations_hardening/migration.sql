-- PowerChain Copilot Mobile v1.0.0 operations hardening.
-- Adds durable ingestion idempotency, alarms/events, source sequences, and safe-action request binding.


ALTER TABLE "ems_snapshots" ADD COLUMN IF NOT EXISTS "sequence" TEXT;
ALTER TABLE "iot_devices" ADD COLUMN IF NOT EXISTS "sequence" TEXT;
ALTER TABLE "depin_nodes" ADD COLUMN IF NOT EXISTS "sequence" TEXT;
ALTER TABLE "safe_action_intents" ADD COLUMN IF NOT EXISTS "request_hash" TEXT;

-- Backfill old intents before enforcing request binding for newly-created rows.
-- Legacy rows are deliberately marked non-replayable. New intents receive a canonical SHA-256 request hash in application code.
UPDATE "safe_action_intents"
SET "request_hash" = concat('legacy:', "id")
WHERE "request_hash" IS NULL;
ALTER TABLE "safe_action_intents" ALTER COLUMN "request_hash" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "operational_alarms" (
  "id" TEXT PRIMARY KEY,
  "site_id" TEXT NOT NULL REFERENCES "energy_sites"("id") ON DELETE CASCADE,
  "resource_id" TEXT,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT,
  "severity" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "observed_at" TIMESTAMPTZ NOT NULL,
  "opened_at" TIMESTAMPTZ NOT NULL,
  "acknowledged_at" TIMESTAMPTZ,
  "resolved_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "operational_events" (
  "id" TEXT PRIMARY KEY,
  "site_id" TEXT REFERENCES "energy_sites"("id") ON DELETE SET NULL,
  "resource_id" TEXT,
  "kind" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "actor_type" TEXT NOT NULL,
  "actor_id" TEXT,
  "source" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "occurred_at" TIMESTAMPTZ NOT NULL,
  "received_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ingest_receipts" (
  "id" TEXT PRIMARY KEY,
  "scope" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "request_hash" TEXT NOT NULL,
  "record_count" INTEGER NOT NULL,
  "source" TEXT,
  "received_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "ingest_receipts_scope_idempotency_key_key" UNIQUE ("scope", "idempotency_key")
);

CREATE INDEX IF NOT EXISTS "operational_alarms_site_id_state_severity_opened_at_idx"
  ON "operational_alarms"("site_id", "state", "severity", "opened_at" DESC);
CREATE INDEX IF NOT EXISTS "operational_alarms_resource_id_state_idx"
  ON "operational_alarms"("resource_id", "state");
CREATE INDEX IF NOT EXISTS "operational_events_site_id_occurred_at_id_idx"
  ON "operational_events"("site_id", "occurred_at" DESC, "id");
CREATE INDEX IF NOT EXISTS "operational_events_kind_occurred_at_idx"
  ON "operational_events"("kind", "occurred_at" DESC);
CREATE INDEX IF NOT EXISTS "ingest_receipts_received_at_idx"
  ON "ingest_receipts"("received_at" DESC);
CREATE INDEX IF NOT EXISTS "safe_action_intents_status_expires_at_idx"
  ON "safe_action_intents"("status", "expires_at");
CREATE INDEX IF NOT EXISTS "iot_devices_site_id_status_id_idx"
  ON "iot_devices"("site_id", "status", "id");
CREATE INDEX IF NOT EXISTS "depin_nodes_site_id_status_id_idx"
  ON "depin_nodes"("site_id", "status", "id");
CREATE INDEX IF NOT EXISTS "ems_snapshots_source_observed_at_idx"
  ON "ems_snapshots"("source", "observed_at" DESC);

-- Audit/event history is append-only. Corrections are represented as new events.
CREATE OR REPLACE FUNCTION powerchain_reject_operational_event_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'operational_events is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS operational_events_no_update ON "operational_events";
CREATE TRIGGER operational_events_no_update BEFORE UPDATE OR DELETE ON "operational_events"
FOR EACH ROW EXECUTE FUNCTION powerchain_reject_operational_event_mutation();
