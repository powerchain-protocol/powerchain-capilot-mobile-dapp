CREATE TABLE "energy_sites" (
  "id" text PRIMARY KEY,
  "organization_id" text,
  "name" text NOT NULL,
  "timezone" text NOT NULL DEFAULT 'UTC',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "energy_sites_organization_id_idx" ON "energy_sites"("organization_id");

CREATE TABLE "site_access" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL,
  "site_id" text NOT NULL REFERENCES "energy_sites"("id") ON DELETE CASCADE,
  "role" text NOT NULL DEFAULT 'viewer',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "site_access_user_site_key" UNIQUE ("user_id", "site_id")
);
CREATE INDEX "site_access_site_id_idx" ON "site_access"("site_id");

CREATE TABLE "ems_snapshots" (
  "id" text PRIMARY KEY,
  "site_id" text NOT NULL REFERENCES "energy_sites"("id") ON DELETE CASCADE,
  "source" text NOT NULL,
  "mode" text NOT NULL,
  "status" text NOT NULL,
  "generation_kw" numeric(20,6) NOT NULL,
  "load_kw" numeric(20,6) NOT NULL,
  "storage_power_kw" numeric(20,6) NOT NULL,
  "grid_exchange_kw" numeric(20,6) NOT NULL,
  "battery_soc_percent" numeric(7,4),
  "frequency_hz" numeric(8,4),
  "observed_at" timestamptz NOT NULL,
  "received_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "ems_snapshots_site_observed_idx" ON "ems_snapshots"("site_id", "observed_at" DESC);

CREATE TABLE "iot_devices" (
  "id" text PRIMARY KEY,
  "site_id" text NOT NULL REFERENCES "energy_sites"("id") ON DELETE CASCADE,
  "kind" text NOT NULL,
  "label" text NOT NULL,
  "status" text NOT NULL,
  "firmware" text,
  "last_seen_at" timestamptz,
  "source" text NOT NULL,
  "mode" text NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "iot_devices_site_status_idx" ON "iot_devices"("site_id", "status");
CREATE INDEX "iot_devices_last_seen_idx" ON "iot_devices"("last_seen_at");

CREATE TABLE "depin_nodes" (
  "id" text PRIMARY KEY,
  "site_id" text REFERENCES "energy_sites"("id") ON DELETE SET NULL,
  "network" text NOT NULL,
  "status" text NOT NULL,
  "peer_id" text,
  "endpoint" text,
  "last_heartbeat_at" timestamptz,
  "source" text NOT NULL,
  "mode" text NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "depin_nodes_site_status_idx" ON "depin_nodes"("site_id", "status");
CREATE INDEX "depin_nodes_network_status_idx" ON "depin_nodes"("network", "status");

CREATE TABLE "operational_wallets" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL,
  "address" text NOT NULL,
  "network" text NOT NULL,
  "label" text,
  "is_primary" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "operational_wallets_network_address_key" UNIQUE ("network", "address")
);
CREATE INDEX "operational_wallets_user_network_primary_idx" ON "operational_wallets"("user_id", "network", "is_primary");

CREATE TABLE "safe_action_intents" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL,
  "organization_id" text,
  "action" text NOT NULL,
  "resource_id" text NOT NULL,
  "reason" text NOT NULL,
  "risk" text NOT NULL,
  "status" text NOT NULL,
  "idempotency_key" text NOT NULL,
  "parameters" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "simulation" jsonb,
  "requires_human_approval" boolean NOT NULL,
  "requires_wallet_signature" boolean NOT NULL,
  "policy_reasons" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "safe_action_intents_user_idempotency_key" UNIQUE ("user_id", "idempotency_key")
);
CREATE INDEX "safe_action_intents_user_created_idx" ON "safe_action_intents"("user_id", "created_at" DESC);
CREATE INDEX "safe_action_intents_resource_action_idx" ON "safe_action_intents"("resource_id", "action", "created_at" DESC);
