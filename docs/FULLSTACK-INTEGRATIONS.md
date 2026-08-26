PowerChain Copilot Mobile — Full-stack integrations

• Architecture

```text
Expo mobile app
   │
   ├── Account/session client
   ├── Onboarding
   ├── Solana wallet (Android MWA)
   ├── Solana read client
   └── Copilot UI
          │
          ▼
PowerChain API /api/v1
   │
   ├── Auth + accounts
   ├── Wallet verification
   ├── AI gateway
   ├── Pyth
   ├── Birdeye
   ├── Solana RPC
   └── Audit
          │
          ▼
PostgreSQL + Prisma
```

External API keys are server-only.

Never add these values to `EXPO_PUBLIC_*` variables:

```text
OPENAI_API_KEY
PYTH_API_KEY
BIRDEYE_API_KEY
DATABASE_URL
```

• API endpoints

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout

GET    /api/v1/account/me
PATCH  /api/v1/account/profile

PATCH  /api/v1/onboarding
POST   /api/v1/onboarding/complete

POST   /api/v1/wallets/challenge
POST   /api/v1/wallets/verify

POST   /api/v1/ai/chat

GET    /api/v1/market/pyth
GET    /api/v1/market/birdeye/price

GET    /api/v1/solana/balance
GET    /api/v1/solana/health

GET    /api/v1/health
GET    /api/v1/health/ready
```

• Prisma 7

The schema uses the Prisma 7 `prisma-client` generator and generates the server client into:

```text
apps/api/src/generated/prisma
```

PostgreSQL connectivity uses:

```text
@prisma/adapter-pg
pg
```

The database URL is configured through `apps/api/prisma.config.ts`, not in the Prisma datasource block.

Commands:

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev --name init_powerchain_mobile
pnpm exec prisma migrate deploy
```

A baseline SQL migration is included under:

```text
prisma/migrations/20260824190000_init_powerchain_mobile/
```

• Accounts

Account authentication is email/password with:

```text
scrypt password hashing
random bearer session token
SHA-256 token hash at rest
server-side expiry
revocation on logout
Expo SecureStore on the device
```

Raw session tokens are never persisted in PostgreSQL.

• Wallet verification

Linking a wallet requires proof of control:

```text
1. Authenticated user requests challenge.
2. Server creates a five-minute nonce.
3. Wallet signs the exact challenge.
4. Client submits signature.
5. Server verifies detached Ed25519 signature.
6. Wallet is marked verified.
7. Audit event is recorded.
```

The server never requests a private key.

• Solana

The mobile integration has separate platform providers:

```text
SolanaWalletProvider.android.tsx
SolanaWalletProvider.ios.tsx
```

Android uses Solana Mobile Wallet Adapter through `@wallet-ui/react-native-web3js`.

The iOS provider intentionally reports wallet signing as unsupported rather than presenting a non-functional connect button.

Read-only Solana RPC is available independently of wallet signing.

• AI

The backend uses the OpenAI Responses API.

The default model is environment-controlled:

```text
OPENAI_MODEL=gpt-5.6-terra
```

The AI route:

- persists user and assistant messages
- limits mobile input to 2,000 characters
- loads recent conversation history
- sets `store: false`
- records provider/model metadata
- creates an audit event
- does not sign or execute blockchain actions

• Pyth

Pyth is called only from the backend.

Default Hermes base:

```text
https://pyth.dourolabs.app/hermes
```

Authentication:

```text
Authorization: Bearer $PYTH_API_KEY
```

The mobile app sends feed IDs to PowerChain API and receives normalized numeric prices.

• Birdeye

Birdeye is called only from the backend.

Default base:

```text
https://public-api.birdeye.so
```

Headers:

```text
X-API-KEY: $BIRDEYE_API_KEY
x-chain: solana
```

Current spot-price endpoint:

```text
GET /defi/price?address=<mint>
```

• Onboarding

```text
Welcome
  ↓
Account
  ↓
Profile
  ↓
Solana wallet
  ↓
AI & market integrations
  ↓
Complete
```

The wallet step is optional so users on unsupported platforms can finish onboarding.

• Production hardening still required before public mainnet write access

The package deliberately does not treat sample integration code as audited signing infrastructure.

Before enabling mainnet write operations add:

```text
rate limiting
email verification
MFA / passkeys as required
CSRF strategy for any cookie-based web clients
device/session management UI
session rotation
password reset
account recovery
abuse controls
AI per-user quotas
provider timeouts
provider circuit breakers
market-data caching
Pyth staleness thresholds
Birdeye rate-limit backoff
transaction simulation
exact instruction review
mainnet allowlists
wallet-signing telemetry
structured audit retention
secret manager
database backups
migration CI
SAST / dependency scanning
native Android release testing
iOS wallet strategy separate from MWA
```
