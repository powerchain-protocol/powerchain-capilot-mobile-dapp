# PowerChain Energy Platform Modules v1.0.0

## Objective

The Energy application remains stable while its operational backend contract
becomes independently buildable. EMS, IoT and DePIN are exposed through pure
contracts and provider-neutral clients; the new Express/Prisma/Supabase backend
is isolated under `backend/platform-express`.

```text
Expo / Dashboard
      │
      ├── @powerchain/energy-contracts
      ├── @powerchain/platform-adapters
      ├── @powerchain/platform-clients
      │
      ▼
EXPO_PUBLIC_ENERGY_API_URL
      │
      ▼
backend/platform-express
      │
      ├── /api/v1/health
      ├── /api/v1/config
      ├── /api/v1/ems/*
      ├── /api/v1/iot/*
      ├── /api/v1/depin/*
      └── /api/v1/safe-actions/*
      │
      ├── Prisma/PostgreSQL
      ├── optional Supabase Auth
      ├── Solana/Sui RPC
      └── external control planes
```

The existing Fastify Copilot/PWRC API is not replaced by this workspace.

## Modules

### EMS

Authoritative physical state:

- demand
- generation
- storage state of charge
- grid import/export
- forecast deviation
- flexibility availability
- directional energy flow

Every physical value carries explicit units, timestamps and a source/quality
boundary. Market data, blockchain state and Copilot analysis do not overwrite
physical telemetry.

### IoT

Supported device classes include:

- smart meters
- inverters
- battery controllers
- EV chargers
- weather stations
- gateways
- sensors

Telemetry values are represented as decimal strings at API boundaries.

### DePIN

DePIN nodes track:

- network
- node type
- operator/site references
- heartbeat state
- identity reference
- reward asset/base units

Reward amounts are decimal strings, not JavaScript floating-point numbers.

## Provider-neutral authentication

The client-facing contract is `AuthAdapter`.

The deployed application can keep its current PowerChain auth behavior while
future applications can inject another provider. The isolated backend includes a
server-side `AuthVerifier` abstraction with development and Supabase adapters.

No frontend module imports `@supabase/supabase-js` or Prisma.

## Provider-neutral wallets

`WalletAdapter` defines:

```text
connect
disconnect
getAccount
signMessage
signTransaction
```

Solana and Sui transports are injected by the host application. This avoids
binding domain code to one wallet SDK.

## Solana and Sui clients

`@powerchain/platform-clients` contains small provider-neutral JSON-RPC clients.

Solana:

```text
getHealth
getLatestBlockhash
getBalance
getAccountInfo
```

Sui:

```text
sui_getLatestCheckpointSequenceNumber
sui_getObject
```

Provider-specific RPC URLs remain configuration.

## Market data

`MarketDataClient` exposes price and quote contracts. The mobile application
uses the authenticated PowerChain backend rather than embedding Birdeye/Pyth/
CoinGecko secrets in Expo.

## Safe Actions

A write operation is never a direct UI mutation.

```text
Intent
  ↓
Preview
  ↓
Policy reasons
  ↓
Human confirmation
  ↓
Atomic claim
  ↓
External control plane
  ↓
Receipt / UNKNOWN
```

Default:

```env
ACTION_EXECUTION_ENABLED=false
```

Execution also requires the relevant control-plane URL and server-only secret.

Transport ambiguity becomes `unknown`, not synthetic failure, because retrying a
physical dispatch or device command can be unsafe.

## Isolated backend workspace

```text
backend/platform-express/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── auth/
│   ├── db/
│   ├── routes/
│   ├── services/
│   ├── app.ts
│   ├── config.ts
│   ├── index.ts
│   └── supabase.ts
├── .env.example
├── package.json
└── prisma.config.ts
```

Database authority remains local to this workspace through
`ENERGY_DATABASE_URL`.

Supabase is an optional auth/backend integration, not the source of physical
telemetry truth or PWRC financial accounting.

## Frontend routes

```text
/(app)/energy
/(app)/energy/flow
/(app)/iot
/(app)/depin
```

The five primary tabs remain unchanged. Energy/IoT/DePIN are routed from the
Overview/System workspaces instead of adding more permanent mobile tabs.

## Health and config

Public-safe:

```text
GET /api/v1/health
GET /api/v1/health/live
GET /api/v1/health/ready
GET /api/v1/config
```

`/api/v1/config` exposes provider names, selected networks and configured state.
It does not expose database URLs, Supabase service-role keys, wallet secrets or
control-plane secrets.

## Environment

The Expo app can preserve the current API while independently selecting the
Energy backend:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
EXPO_PUBLIC_ENERGY_API_URL=http://127.0.0.1:8200/api/v1
```

If `EXPO_PUBLIC_ENERGY_API_URL` is omitted, it falls back to
`EXPO_PUBLIC_API_URL`, preserving existing deployments.

## Production doctrine

```text
Physical systems provide truth.
AI prepares decisions.
Humans approve sensitive actions.
Wallets authorize financial execution.
External control planes execute physical commands.
PowerChain records provenance and reconciliation.
```
