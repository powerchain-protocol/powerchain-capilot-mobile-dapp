# @powerchain/operations-api

Isolated Express + Prisma 7 + PostgreSQL operations backend for PowerChain EMS, IoT and DePIN.

## Build boundary

This workspace is intentionally independent from `server/` (Fastify Copilot/PWRC API). Mobile clients normally call Fastify on port 8000. Fastify forwards reviewed operational routes to this backend using `OPERATIONS_INTERNAL_SECRET` plus authenticated user/organization identity headers.

## Local development

```bash
cp backend/operations-api/.env.example backend/operations-api/.env
pnpm operations:prisma:generate
pnpm operations:prisma:migrate
pnpm operations:backend
```

Set the same internal secret in the Fastify environment:

```env
OPERATIONS_API_URL=http://127.0.0.1:8200/api/v1
OPERATIONS_INTERNAL_SECRET=replace-with-a-long-random-secret
```

For standalone local testing only, `OPERATIONS_AUTH_PROVIDER=development` accepts `X-User-Id` and `X-Organization-Id`. This mode is rejected in production.

## Production guarantees

- site-scoped tenant isolation
- read-only Solana/Sui clients
- public wallet identity registry only
- no private-key/seed-phrase fields
- prepare-only physical/financial actions
- deterministic idempotency hashes
- atomic safe-action + outbox commit
- optional Supabase Realtime projection
- sanitized health/config
