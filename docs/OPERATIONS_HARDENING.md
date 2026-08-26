# Operations Hardening — v1.0.0

This pass strengthens the EMS/IoT/DePIN operational boundary without introducing a direct physical or financial execution API.

## Added

- user-accessible site discovery (`GET /api/v1/sites`);
- bounded cursor pagination for device, node, alarm and event feeds;
- operational alarms and append-only event history;
- read-only site digital-twin projection;
- bounded and idempotent internal telemetry/heartbeat/alarm ingestion;
- source sequence identities for replay/order diagnostics;
- canonical SHA-256 binding for safe-action idempotency;
- device/node/alarm/wallet-specific authorization before safe-action preparation;
- constant-time internal bearer comparison;
- request IDs and no-store/security response headers;
- actual database readiness probe;
- timeout- and response-size-bounded RPC/market provider reads;
- mobile stale-while-revalidate operational query cache;
- selected-site context and reusable site/freshness/alarm/twin UI components.

## Explicitly not added

- server-held wallet private keys;
- direct EMS dispatch execution;
- blockchain settlement signing;
- silent cache promotion to authoritative telemetry;
- public provider-ingestion routes.

## Database controls

The `20260826090000_operations_hardening` migration adds:

- `operational_alarms`;
- append-only `operational_events`;
- `ingest_receipts` with `(scope, idempotency_key)` uniqueness;
- request hashes on `safe_action_intents`;
- source `sequence` fields;
- operational query indexes.

Legacy safe-action rows are deliberately marked with `legacy:<id>` rather than synthesizing a canonical request hash that did not exist when they were created. This makes legacy idempotency replay fail closed.

## Out-of-order telemetry and heartbeat protection

Current-state projections are monotonic by observation time. IoT heartbeats, DePIN heartbeats, and alarm updates that arrive after a newer observation are accepted into the idempotent ingestion/audit path but are not allowed to overwrite the newer current state. The append-only operational event records the stale update as `*.ignored_stale` with `metadata.applied=false`. EMS snapshots remain append-oriented and the latest projection is selected by observation time.

This separates **evidence acceptance** from **current-state mutation**: late evidence remains auditable without regressing the digital twin or operational status shown to the mobile client.
