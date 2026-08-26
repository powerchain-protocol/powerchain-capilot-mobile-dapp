# PowerChain Operations API

Isolated Express + Prisma + optional Supabase workspace for EMS, IoT, DePIN, alarms/events, operational digital twins, public-wallet registry, read-only chain/market clients and safe-action preparation.

This service is designed to sit behind the canonical Fastify API. User-facing `/v1/*` reads require `OPERATIONS_INTERNAL_BEARER_SECRET` plus a Fastify-provided `x-powerchain-user-id`. Provider ingestion requires the internal bearer but never trusts a user-supplied tenant scope.

## Safety model

- physical energy state remains authoritative;
- telemetry includes source, mode, observed/received times, freshness and optional source sequence;
- Solana/Sui clients are read-only;
- provider reads are timeout- and size-bounded;
- provider ingestion is bounded and idempotent;
- operational events are append-only;
- safe actions prepare intents only;
- idempotency keys are bound to canonical request hashes;
- dispatch/alarm/settlement preparation requires resource authorization;
- settlement/wallet actions require a user-controlled wallet signature;
- no private keys or seed phrases are accepted;
- Supabase service-role credentials remain server-only.

## User-facing internal routes

```text
GET  /health/live
GET  /health/ready
GET  /v1/config
GET  /v1/sites
GET  /v1/ems/overview?siteId=...
GET  /v1/iot/devices?siteId=...&limit=...&cursor=...
GET  /v1/depin/nodes?siteId=...&limit=...&cursor=...
GET  /v1/alarms?siteId=...&state=open
GET  /v1/events?siteId=...&kind=...
GET  /v1/twin?siteId=...
GET  /v1/market-data/prices?symbols=SOL,PWRC
POST /v1/actions/prepare
```

## Provider ingestion routes

```text
POST /v1/ingest/ems
POST /v1/ingest/iot-heartbeats
POST /v1/ingest/depin-heartbeats
POST /v1/ingest/alarms
```

Each ingestion request must include the same valid `Idempotency-Key` in its header and body envelope. A duplicate identical payload returns the prior receipt; a duplicate key with a different payload is rejected.

## Local gates

```bash
pnpm --filter @powerchain/operations-api prisma:generate
pnpm --filter @powerchain/operations-api prisma:validate
pnpm --filter @powerchain/operations-api typecheck
pnpm test:operations
pnpm verify:operations
```

### Ordering safety

IoT/DePIN heartbeat and alarm projections reject stale state replacement by comparing provider observation timestamps inside the transaction. Late data is still recorded as an operational event with `applied=false`, preserving audit evidence without rolling the current projection backward.
