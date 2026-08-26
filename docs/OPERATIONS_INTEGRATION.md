# PowerChain Copilot Mobile — EMS / IoT / DePIN Operations

Version: `1.0.0`

## Architecture

```text
Expo mobile app
  -> Fastify public API
       -> authenticated user boundary
       -> site-scoped authorization
       -> source/freshness-aware operational routes
       -> safe-action preparation
       -> internal Operations Gateway
            -> Express operations API
                 -> Prisma / PostgreSQL
                 -> optional Supabase Realtime publisher
                 -> EMS / IoT / DePIN ingestion
                 -> alarms + append-only events
                 -> digital-twin projection
                 -> Solana read client
                 -> Sui read client
                 -> provider-neutral market-data client
```

The Express operations API remains isolated under `backend/operations-api/`. The deployed mobile/Fastify surface can keep a stable API contract while persistence, provider integrations and ingestion workers are built and deployed independently.

## Trust and freshness contract

Every EMS/IoT/DePIN result carries explicit source metadata:

- source identity;
- `live | demo | unavailable` mode;
- source observation timestamp;
- server receive timestamp;
- `fresh | stale | unknown` classification;
- configured freshness threshold;
- optional upstream sequence identity.

The mobile stale-while-revalidate cache may preserve the last verified read during a connectivity failure, but cached data is explicitly marked stale. No route converts absent telemetry into a live-looking value.

## Public API v1

Public/sanitized:

```text
GET /api/v1/health
GET /api/v1/config
```

Authenticated:

```text
GET  /api/v1/sites
GET  /api/v1/ems/overview?siteId=...
GET  /api/v1/iot/devices?siteId=...&limit=...&cursor=...
GET  /api/v1/depin/nodes?siteId=...&limit=...&cursor=...
GET  /api/v1/alarms?siteId=...&state=open
GET  /api/v1/events?siteId=...&kind=...
GET  /api/v1/twin?siteId=...
GET  /api/v1/market-data/prices?symbols=SOL,PWRC
POST /api/v1/actions/prepare
```

The existing `/api/v1/capilot-mobile/*` and `/api/v1/copilot-mobile/*` compatibility aliases are retained.

## Private provider ingestion

The provider-facing ingestion surface exists only on the isolated operations API and is not proxied through public Fastify routes:

```text
POST /v1/ingest/ems
POST /v1/ingest/iot-heartbeats
POST /v1/ingest/depin-heartbeats
POST /v1/ingest/alarms
```

Controls:

- internal bearer authentication;
- body/header `Idempotency-Key` binding;
- canonical SHA-256 payload hash;
- duplicate replay returns the existing receipt;
- same key + different payload fails with `409 IDEMPOTENCY_KEY_REUSE`;
- bounded batch size and payload size;
- decimal-string validation for telemetry values;
- future timestamp skew rejection;
- event provenance generated from accepted ingestion.

## Tenant and resource isolation

Knowing a site, device, node, alarm or wallet ID is not sufficient to act on it.

- EMS and settlement preparation resolve directly to a permitted site.
- IoT refresh resolves device -> site -> user access.
- DePIN refresh resolves node -> site -> user access.
- Alarm acknowledgement preparation resolves alarm -> site -> user access.
- Wallet signature preparation requires wallet ownership by the authenticated user.

## Safe actions

```text
ems.dispatch.prepare          review_required
iot.device.refresh            read_only
depin.node.refresh            read_only
alarm.acknowledge.prepare     review_required
wallet.signature.prepare      wallet_signature_required
settlement.prepare            wallet_signature_required
```

`POST /api/v1/actions/prepare` creates a reviewable intent. It is not an execution endpoint.

Idempotency is request-bound: the key is SHA-256-bound to action, resource, reason and parameters. Reusing a key for a different request fails closed.

## Digital twin

`GET /api/v1/twin` computes a read-only site projection from authoritative source state:

- latest EMS telemetry;
- operational IoT counts;
- operational DePIN counts;
- open and critical alarm counts;
- source freshness.

The projection is not treated as a new source of truth and never overwrites upstream physical state.

## Mobile integration

Hooks:

- `useOperationalHealth`
- `useOperationalSites`
- `useEmsOverview`
- `useIotDevices`
- `useDepinNodes`
- `useOperationalAlarms`
- `useOperationalEvents`
- `useOperationalTwin`
- `useMarketPrices`
- `useSafeAction`

Reusable components:

- `SiteSelector`
- `OperationalStatusCard`
- `OperationalMetric`
- `SourceBadge`
- `FreshnessIndicator`
- `DigitalTwinSummary`
- `OperationalAlarmList`
- `SafeActionPanel`

## Migrations

Apply operations migrations in order, then generate the Prisma client:

```bash
pnpm --filter @powerchain/operations-api prisma:generate
pnpm --filter @powerchain/operations-api prisma:migrate:status
```

The hardening migration adds ingestion receipts, alarm/event persistence, source sequences and safe-action request hashes. `operational_events` is append-only at the database level.
