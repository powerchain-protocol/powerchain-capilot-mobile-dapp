# PowerChain Copilot Monorepo v1.0.0

## Canonical layout

```text
apps/
  mobile/          Expo Router iOS / Android / PWA client
  api/             Fastify Copilot, PWRC credits, auth and public API
  operations-api/  Express + Prisma + Supabase EMS / IoT / DePIN API
  mcp-gateway/     Internal TypeScript/Express MCP gateway

services/
  mcp-python/      Internal Python/FastAPI MCP gateway

packages/
  pwrc-credits/
  mcp-client/
  energy-contracts/
  platform-adapters/
  platform-clients/

docs/
scripts/
types/
```

## Ownership rules

- `apps/mobile` never imports Prisma, Supabase service-role credentials, provider API keys, HMAC secrets or database URLs.
- `apps/api` is authoritative for Copilot billing, PWRC reservations/receipts, authentication and Payment Kernel verification.
- `apps/operations-api` is authoritative for the separately deployable EMS/IoT/DePIN operational backend contract.
- `apps/mcp-gateway` and `services/mcp-python` are internal gateways and never settle PWRC independently.
- Cross-app contracts belong under `packages/`; application-specific state belongs inside the owning app.

## Commands

```bash
corepack use pnpm@11.23.0
pnpm install
pnpm dev
pnpm web
pnpm typecheck
pnpm verify
```

Targeted development:

```bash
pnpm dev:mobile
pnpm api:dev
pnpm operations:dev
pnpm mcp:dev
```
