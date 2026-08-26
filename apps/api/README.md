# PowerChain Copilot Mobile API

**Version 1.0.0**

The API is the security boundary between the Expo client and PostgreSQL, OpenAI, Pyth, Birdeye, and server-managed Solana infrastructure.

## Development

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

## Environment

Copy `.env.example` and configure:

```text
DATABASE_URL
SESSION_TTL_DAYS
CORS_ORIGIN
SOLANA_RPC_URL
SOLANA_NETWORK
OPENAI_API_KEY
OPENAI_MODEL
PYTH_API_KEY
PYTH_HERMES_URL
BIRDEYE_API_KEY
BIRDEYE_BASE_URL
```

## API areas

```text
auth
account
sessions
onboarding
wallets
ai
conversations
market
solana
integrations
health
```

## Security boundary

The API must never return provider secrets, database credentials, raw password hashes, or stored session-token hashes.

Wallet verification uses a short-lived challenge and Ed25519 signature validation. Blockchain signing remains in the user's wallet.

## Production

Before internet-facing production deployment, add distributed rate limiting, secret-manager integration, structured metrics/tracing, production CORS policy, credential-abuse controls, account recovery, and database connection pooling.

## Environment

Copy:

```text
apps/api/.env.example
```

to:

```text
apps/api/.env
```

Then validate:

```bash
npm run env:check
```

The server environment controls:

```text
Fastify logging / proxy / body limit
PostgreSQL
session TTL
AI rate limiting
OpenAI
Solana
Sui
Pyth
Birdeye
market-cache TTL
```

No provider secret is exposed through the frontend.

### Safe runtime config

```text
GET /api/v1/config
```

returns non-secret application metadata only.

## PWRC Copilot Credits

Credit accounting is implemented under `apps/api/src/credits/` and persisted by
`prisma/migrations/20260825102000_pwrc_copilot_credits`.

Production top-ups require both:

```text
PWRC_TREASURY_ADDRESS
PAYMENT_KERNEL_WEBHOOK_SECRET
```

A Solana Pay intent is not sufficient to credit an account; only a verified
`payment.settled` Payment Kernel event can create a `PwrcCreditFunding` entry.
