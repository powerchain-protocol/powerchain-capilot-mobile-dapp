# Telemetry Integrity & Freshness

Version 1.0.0

PowerChain treats telemetry timestamps, source identity, mode and freshness as part of the data—not decorative metadata.

## Rules

- `observedAt` is provider/device observation time.
- `receivedAt` is platform ingestion time.
- stale telemetry cannot be presented as live.
- late/out-of-order ingestion remains auditable but cannot overwrite newer projected state.
- sequence/idempotency information is preserved when available.
- digital-twin state is recomputed from authoritative current projections.

## Integrity states

- `healthy`: checks are current and no blocking evidence condition exists.
- `degraded`: stale telemetry, low availability, or open/critical alarms affect trust.
- `insufficient_data`: authoritative evidence is not sufficient for a confident operational state.
