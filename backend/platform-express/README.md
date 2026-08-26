# PowerChain Energy Platform Backend v1.0.0

This workspace is deliberately isolated from the deployed Copilot/Fastify API.
It is the independently buildable Express + Prisma + Supabase contract for EMS,
IoT and DePIN services.

## Authority

- PostgreSQL/Prisma: transactional Energy/IoT/DePIN state.
- Supabase: optional authentication provider; not the financial ledger.
- External EMS/IoT/DePIN control planes: execution authority only when explicitly
  configured and `ACTION_EXECUTION_ENABLED=true`.
- Mobile/Expo: never receives database, Supabase service-role or control-plane
  secrets.

## Routes

```text
GET  /api/v1/health
GET  /api/v1/health/live
GET  /api/v1/health/ready
GET  /api/v1/config

GET  /api/v1/ems/overview
GET  /api/v1/ems/flow
POST /api/v1/ems/dispatch/preview

GET  /api/v1/iot/devices
GET  /api/v1/iot/devices/:deviceId/telemetry

GET  /api/v1/depin/nodes
GET  /api/v1/depin/summary

POST /api/v1/safe-actions/preview
POST /api/v1/safe-actions/execute
```

`safe-actions/execute` is fail-closed unless an explicit control plane, secret and
execution flag are configured. Ambiguous control-plane transport results become
`unknown`, not `failed`, so duplicate physical execution is not implied safe.

## Local

```bash
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```
