# PowerChain Copilot Mobile

**Version 1.0.0** · Expo / React Native · Solana · AI · Renewable Energy · Energy RWA

PowerChain Copilot Mobile is the mobile operations client for the PowerChain platform. It combines AI-assisted operational workflows, renewable-energy context, Energy RWA data, Solana wallet connectivity, market data, evidence, conversations, account management, and review-first execution patterns in a compact Expo application.

> AI analyzes and prepares. Humans review. Wallets authorize. PowerChain records provenance.

## Status

Release: **1.0.0**

Primary application targets:

- iOS
- Android
- Expo development builds
- Expo Web

Default appearance: **Light**

Additional appearances:

- Dark
- Dark Green
- System

## Core capabilities

- PowerChain Copilot conversation interface
- persistent conversations and message history
- professional assistant/user message presentation
- `0 / 2000` message composer
- chat skeleton, typing, retry, and error states
- OpenAI-backed server AI gateway
- Solana RPC and wallet integration
- signed wallet-ownership verification
- Pyth oracle integration
- Birdeye market-data integration
- normalized and cached market prices
- SOL, PWRC, USDC, EURC, and SUI asset registry
- Solana and Sui network registry
- Web3 token/network/wallet icons
- accounts and server-backed sessions
- resumable onboarding
- PostgreSQL + Prisma 7 persistence
- audit events and provenance hooks
- provider health/status surfaces
- Light, Dark, and Dark Green design themes
- PowerChain app icons and brand assets

## Architecture

```text
Expo Mobile App
   │
   ├── UI / Theme / Navigation
   ├── Account + Session Client
   ├── Onboarding
   ├── Copilot Conversations
   ├── Solana Wallet / Read Client
   ├── Web3 Asset Registry
   └── Integration Status
          │
          ▼
PowerChain API /api/v1
   │
   ├── Auth / Accounts / Sessions
   ├── AI Gateway
   ├── Wallet Verification
   ├── Solana RPC
   ├── Pyth
   ├── Birdeye
   ├── Market Cache
   └── Audit
          │
          ▼
PostgreSQL + Prisma
```

External service credentials remain server-side. The Expo bundle must not contain `DATABASE_URL`, `OPENAI_API_KEY`, `PYTH_API_KEY`, or `BIRDEYE_API_KEY`.

## Project structure

```text
app/
├── (onboarding)/
│   ├── welcome.tsx
│   ├── account.tsx
│   ├── profile.tsx
│   ├── wallet.tsx
│   ├── integrations.tsx
│   └── complete.tsx
└── README.md

src/
├── api/
├── components/
│   ├── brand/
│   ├── chat/
│   ├── charts/
│   ├── integrations/
│   ├── ui/
│   └── web3/
├── constants/
├── data/
├── features/
├── hooks/
├── integrations/
│   ├── ai/
│   ├── birdeye/
│   ├── market/
│   ├── pyth/
│   ├── solana/
│   └── status/
├── styles/
├── theme/
├── types/
└── utils/

server/
├── src/
│   ├── config/
│   ├── integrations/
│   ├── lib/
│   ├── routes/
│   └── services/
└── README.md

prisma/
├── schema.prisma
├── migrations/
└── README.md

docs/
├── FULLSTACK-INTEGRATIONS.md
├── PRODUCTION-CHECKLIST.md
├── WEB3-ICONS.md
└── README.md
```

## Mobile UI system

PowerChain uses a compact mobile system designed to fit operational information without excessive rounded surfaces.

| Surface | Radius |
|---|---:|
| Card | 14px |
| Button | 10px |
| Input | 10px |
| Chat bubble | 12px |
| Conversational corner | 8px |
| Badge / chip | 8px |
| Sheet / modal | 20px |

Cards should use content-driven height. Avoid arbitrary fixed card heights and fixed text widths.

### Copilot message presentation

Raw Markdown headings and list markers are normalized for the mobile conversation surface.

```text
• Energy overview
Verified renewable generation is stable.

• Solar production is above baseline
• Battery reserve is available

• Recommended action
Review the evidence package before settlement.
```

Section titles use restrained medium-weight text rather than large document-style headings.

## Web3 assets

Supported assets:

```text
PWRC   PowerChain / Solana Token-2022
SOL    Solana
USDC   USD Coin
EURC   EURC
SUI    Sui
```

Supported networks:

```text
Solana
Sui
```

Wallet registry:

```text
Phantom
Solflare
Backpack
Ledger
WalletConnect
Generic Wallet
```

Expo Web uses `@web3icons/react`. Native iOS/Android use platform-safe components and local fallbacks so browser SVG DOM components are not bundled into native surfaces.

PWRC uses the PowerChain-owned token mark in `assets/tokens/`.

## Solana

Mobile integration includes:

- devnet / mainnet-beta configuration
- read-only RPC client
- SOL balance reads
- Token-2022 account reads
- Android Mobile Wallet Adapter provider
- explicit iOS unsupported state for MWA
- signed wallet challenge
- server-side Ed25519 verification
- verified linked-wallet persistence

PowerChain does not receive or store wallet private keys.

## AI

The mobile app calls the PowerChain API rather than OpenAI directly.

```text
POST /api/v1/ai/chat
```

The server:

- authenticates the account
- validates the 2,000-character input limit
- loads recent conversation context
- calls the configured OpenAI model
- persists user and assistant messages
- records provider/model metadata
- creates an audit event

AI responses can analyze, recommend, and prepare an action. They must not claim to sign or authorize blockchain transactions.

## Market data

### Pyth

Pyth is server-side and returns normalized price, confidence, exponent, and publish time.

### Birdeye

Birdeye is server-side and provides Solana token price and liquidity context.

### Unified price endpoint

```text
GET /api/v1/market/price
```

Supported sources:

```text
PYTH
BIRDEYE
AUTO
```

Responses distinguish:

```text
cached
stale
observedAt
source
price
confidence
```

Stale market data must never be presented as a fresh quote.

## Accounts and sessions

Authentication uses:

- email/password account creation
- `scrypt` password hashes
- random bearer session tokens
- SHA-256 session-token hashes at rest
- server-side expiration and revocation
- Expo SecureStore on the device

Session API:

```text
GET    /api/v1/account/sessions
DELETE /api/v1/account/sessions/:id
DELETE /api/v1/account/sessions/others
```

## Onboarding

```text
Welcome
  ↓
Account
  ↓
Profile
  ↓
Solana Wallet
  ↓
AI + Market Integrations
  ↓
Complete
```

Onboarding progress is persisted and resumable. Wallet connection remains optional so unsupported platforms can finish account setup.

## Prisma and PostgreSQL

Prisma configuration:

```text
prisma.config.ts
prisma/schema.prisma
prisma/migrations/
```

Core models:

```text
User
AccountProfile
Session
Wallet
WalletChallenge
AiConversation
AiMessage
PriceSnapshot
AuditEvent
```

Generate and migrate with the scripts used by the workspace. Server-local equivalents are documented in `server/README.md`.

## API

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout

GET    /api/v1/account/me
PATCH  /api/v1/account/profile
GET    /api/v1/account/sessions
DELETE /api/v1/account/sessions/:id
DELETE /api/v1/account/sessions/others

PATCH  /api/v1/onboarding
POST   /api/v1/onboarding/complete

POST   /api/v1/wallets/challenge
POST   /api/v1/wallets/verify

POST   /api/v1/ai/chat
GET    /api/v1/ai/conversations
GET    /api/v1/ai/conversations/:id
DELETE /api/v1/ai/conversations/:id

GET    /api/v1/market/pyth
GET    /api/v1/market/birdeye/price
GET    /api/v1/market/price

GET    /api/v1/solana/balance
GET    /api/v1/solana/health

GET    /api/v1/integrations/status
GET    /api/v1/health
GET    /api/v1/health/ready
```

## Environment

Mobile example:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1
EXPO_PUBLIC_SOLANA_NETWORK=devnet
EXPO_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

Server example:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/powerchain_copilot
OPENAI_API_KEY=
OPENAI_MODEL=
PYTH_API_KEY=
BIRDEYE_API_KEY=
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
```

Never put server secrets in an `EXPO_PUBLIC_*` variable.

## Install

Use the repository's canonical package manager and merge the dependency additions into its package manifest.

Web3 Icons:

```bash
pnpm add @web3icons/react
```

Then install the remaining dependencies declared by the repository and `package.additions.json`.

## Development

Typical Expo commands:

```bash
pnpm install
pnpm exec expo start
pnpm exec expo run:ios
pnpm exec expo run:android
```

Server:

```bash
cd server
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

## Verification

Run the workspace's canonical checks, plus:

```bash
node scripts/verify-structure.mjs
pnpm exec expo-doctor
```

Before release verify:

- iOS and Android native builds
- small-phone layouts
- tablet layouts
- Light / Dark / Dark Green / System themes
- keyboard and safe-area behavior
- offline and degraded integrations
- revoked and expired sessions
- wallet connect/verify flows
- `0 / 2000` composer behavior
- long wallet addresses and organization names
- Pyth/Birdeye stale-data handling
- conversation retries and errors
- app icons on real devices

See `docs/PRODUCTION-CHECKLIST.md` for the full release checklist.

## Release policy

The application version remains **1.0.0** for this release. Internal implementation iterations are not exposed as product versions.

Version sources:

```text
VERSION
app.config.example.ts
server/package.json
CHANGELOG.md
```

## Documentation

- `docs/README.md` — documentation index
- `docs/FULLSTACK-INTEGRATIONS.md` — service architecture and API boundaries
- `docs/WEB3-ICONS.md` — token, network, and wallet icon system
- `docs/PRODUCTION-CHECKLIST.md` — release hardening checklist
- `server/README.md` — API development and deployment
- `prisma/README.md` — schema and migration workflow
- `app/README.md` — Expo routing and onboarding
- `CHANGELOG.md` — release history

## Security

Mainnet write operations should remain review-gated and disabled until transaction simulation, exact instruction review, program/mint validation, rate limiting, operational monitoring, and production wallet flows have been validated.

Do not commit:

- private keys
- seed phrases
- database credentials
- OpenAI API keys
- Pyth API keys
- Birdeye API keys
- signing certificates
- provisioning profiles
- Android keystores

## License

Licensed under the MIT License. See `LICENSE`.

## PowerChain

Website: `https://powerchain.ventures`

Application: `https://app.powerchain.ventures`

API: `https://api.powerchain.ventures`

Documentation: `https://docs.powerchain.ventures`

GitHub: `https://github.com/powerchain-protocol`

## Production baseline improvements

The 1.0.0 repository now includes a runnable Expo application root rather than only reusable feature modules.

Primary routes:

```text
app/
├── _layout.tsx
├── index.tsx
├── (auth)/
│   └── login.tsx
├── (onboarding)/
└── (app)/
    └── (tabs)/
        ├── index.tsx
        ├── copilot.tsx
        ├── assets.tsx
        ├── integrations.tsx
        └── settings.tsx
```

The mobile runtime now includes:

- `SafeAreaProvider`
- PowerChain theme provider
- network/offline provider
- account/session provider
- Solana wallet provider
- top-level application error boundary

### Expo baseline

The project is configured for Expo SDK 57 / React Native 0.86 and uses Expo Router as the application entry point.

After dependency installation, run:

```bash
pnpm expo:fix
pnpm doctor
pnpm verify
```

`expo install --fix` remains the canonical compatibility pass for Expo-managed native packages.

### Offline behavior

Loss of network connectivity no longer leaves the UI looking fully operational.

The application shows:

```text
Offline • Showing locally available information
```

Remote actions should remain disabled or surface retryable errors until connectivity returns.

### Verification

Run:

```bash
pnpm verify
```

This validates:

1. required repository structure
2. release metadata at `1.0.0`
3. local TypeScript/JavaScript import resolution

For full validation also run:

```bash
pnpm typecheck
pnpm server:typecheck
pnpm doctor
```

## Frontend install recovery

If the `frontend` package reports:

```text
expo: command not found
```

or:

```text
File 'expo/tsconfig.base' not found
```

use the dedicated repair flow:

```bash
cd frontend
npm run repair:npm
npm run verify
npm run web
```

The repository keeps `expo/tsconfig.base` intact and repairs the dependency tree instead of weakening TypeScript configuration.

## Responsive application shell

PowerChain Copilot uses device-aware presentation rather than scaling the phone interface.

```text
Mobile       < 768px      Floating bottom navigation
Tablet       768–1199px   Persistent top header
Desktop      ≥ 1200px     Full top header + wider content grids
```

Core responsive modules:

```text
src/constants/layout.ts
src/hooks/useResponsiveLayout.ts

src/components/layout/
├── FloatingMobileTabBar.tsx
├── ResponsiveGrid.tsx
├── ResponsiveHeader.tsx
└── index.ts
```

Mobile uses 16px gutters and a safe-area-aware floating navigation dock. Tablet uses 24px gutters and top navigation. Desktop uses 32px gutters, a 1280px application maximum width, and up to three operational columns.

See `docs/RESPONSIVE-LAYOUT.md`.

## Adaptive UI improvements

The responsive shell now uses both width and shortest-edge classification.

A wide phone in landscape remains a mobile interaction surface rather than switching to the tablet header simply because its width exceeds 768px.

### Copilot split view

Tablet and desktop now use:

```text
┌──────────────────────────────────────────────┐
│ Conversations │ Copilot thread              │
│               │                             │
│ Recent thread │ Assistant / user messages   │
│ Recent thread │ Charts / evidence           │
│ Recent thread │                             │
│               │ Composer                    │
└──────────────────────────────────────────────┘
```

Mobile continues to use the focused single-thread experience with floating bottom navigation.

### Adaptive dialogs

`AdaptiveDialog` renders as:

```text
Mobile         bottom sheet
Tablet         centered dialog
Desktop        centered constrained dialog
```

### Theme correctness

Chat avatars, message bubbles, message content, skeletons, and charts now resolve colors from the active PowerChain theme.

Run:

```bash
node scripts/verify-theme.mjs
```

to detect stale static theme-color imports.

## Frontend workspace

The runnable Expo application now lives entirely under:

```text
frontend/
```

Repository:

```text
https://github.com/powerchain-protocol/powerchain-capilot-mobile-app
```

Recommended setup:

```bash
git clone https://github.com/powerchain-protocol/powerchain-capilot-mobile-app.git
cd powerchain-capilot-mobile-app
corepack use pnpm@11.23.0
pnpm install
pnpm --dir frontend run verify:installed
pnpm --dir frontend exec expo start
```

If the repository is already cloned, run the same commands from the repository root. Repository documentation uses clone-relative paths only.

### TypeScript before and after install

Before dependencies are installed:

```text
frontend/tsconfig.json
→ frontend/expo/tsconfig.base.json
```

After dependencies are installed:

```text
frontend/tsconfig.expo.json
→ node_modules/expo/tsconfig.base
```

Validate both layers with:

```bash
npm run verify
npm run verify:installed
```

## TypeScript workspace ownership

The repository root is an orchestration workspace and does not compile the frontend or backend itself.

```text
tsconfig.json
└── types/workspace.d.ts

frontend/tsconfig.json
└── Expo / React Native frontend

frontend/tsconfig.expo.json
└── official installed Expo TypeScript base validation

server/tsconfig.json
└── API / Prisma backend
```

Run:

```bash
npm run typecheck:frontend
npm run typecheck:server
```

or both:

```bash
npm run typecheck
```

The root configuration intentionally excludes `frontend`, `server`, and `node_modules`.

## Full-stack environment

Environment configuration is now split by trust boundary:

```text
.env.example
frontend/.env.example
frontend/.env.production.example
server/.env.example
server/.env.production.example
```

Initialize local files:

```bash
npm run env:init
npm run env:check
```

Start PostgreSQL and migrate:

```bash
npm run db:up
npm run prisma:generate
npm run prisma:migrate
```

Start API + Expo:

```bash
npm run dev:stack
```

Safe runtime configuration is exposed through:

```text
GET /api/v1/config
```

Health endpoints:

```text
/api/v1/health
/api/v1/health/live
/api/v1/health/ready
/health/live
/health/ready
```

See `docs/ENVIRONMENT.md`.

## pnpm / Expo installation

The workspace now standardizes on:

```text
pnpm 11.23.0
```

Install:

```bash
corepack use pnpm@11.23.0
pnpm install
```

Or:

```bash
pnpm run setup
```

Frontend Expo workflow:

```bash
cd powerchain-capilot-mobile-app/frontend

pnpm exec expo start
pnpm exec expo run:ios
pnpm exec expo run:android
pnpm exec expo start --web
```

The invalid dependency:

```text
@wallet-ui/react-native-web3js@^1.0.0
```

has been replaced with the published stable:

```text
@wallet-ui/react-native-web3js@4.3.0
```

`frontend/tsconfig.json` again extends the official:

```text
expo/tsconfig.base
```

so TypeScript and Expo share one canonical configuration after installation.

## PWRC Copilot Credits

PowerChain Copilot v1.0.0 now includes a message-credit kernel:

```text
Quote → Reserve 10,000 PWRC → Generate → Verify → Settle
```

Only a completed, non-empty verified response is settled. Cancellation,
disconnection, generation/setup failure, empty output, and reservation expiry
release the reserved credits.

Reference economics:

```text
1 PWRC = $0.000002 configured reference value
1 completed response = 10,000 PWRC = ≈ $0.02 reference value
```

The reference value is explicitly **not a live market price**.

See `docs/PWRC-COPILOT-CREDITS.md`.

## PWRC Credits hardening

The 1.0.0 credit path now separates generated content from a settled message debit:

```text
Reserve → Generate → Verify → Prepare → Client ACK → Settle
```

This makes a disconnect-before-delivery recoverable without charging the response.

Additional controls include:

```text
Payment Kernel event-id replay protection
Payment Kernel timestamp/HMAC window
atomic top-up intent claim
settlement-id idempotency
append-only webhook receipts
credit-account reconciliation
pending-response expiry recovery
one-time demo-grant concurrency guard
```

The Credits Center can inspect pricing, balance, runway, top-up state, funding history,
ledger history and reconciliation status without consuming a Copilot response credit.

### PWRC delivery and settlement recovery

PWRC credits now use a short delivery acknowledgement boundary after generation. The server reserves credits while generating, verifies the non-empty assistant response, stores it as a temporary pending response, and settles only after the client acknowledges delivery.

```text
Generate → Verify → Pending delivery → ACK → pmsg receipt
```

The default ACK window is `120` seconds. Recovery through `POST /api/v1/ai/chat/recover` is keyed by the original `clientRequestId` and never regenerates a response solely to determine payment state.

Copilot idempotency keys are request-fingerprinted; reusing one for different prompt/context data is a conflict. Payment Kernel event IDs and settlement IDs receive the same strict content-matching treatment.

Settled message receipts and funding records are database-immutable, while abandoned unacknowledged response content is scrubbed during expiry recovery.

## Canonical PWRC credit module

PWRC Copilot accounting is implemented as a real full-stack module, not UI mock
state:

```text
packages/pwrc-credits     canonical bigint/domain + DTO contract
server/src/credits        transactional persistence and Payment Kernel binding
prisma                    DECIMAL(38,0), reservations, ledger, receipts, funding
frontend/src/features/credits authenticated API client + presentation state
frontend/app/(app)/copilot-credits.tsx operator credit center
```

The numeric boundary is fixed:

```text
bigint internally → decimal-string JSON → bigint only when client arithmetic is needed
```

Core tests:

```bash
pnpm run test:credits
```

Full credit verification:

```bash
pnpm run verify:credits
```

## PWRC quote-snapshot hardening

PWRC credit reservations now persist the complete deterministic message quote. The quote hash binds the canonical PWRC asset/network identity and the `delivery_acknowledged` billing trigger, while settlement receipts copy the stored reservation economics rather than recomputing them.

The reconciliation endpoint now checks both account conservation and cross-table evidence consistency across reservations, message receipts, funding records and the append-only ledger.

## MCP Copilot backend

PowerChain Copilot now supports read-only Model Context Protocol tools through the canonical Fastify + PWRC billing path. MCP calls are internal evidence/context reads; they do not create a second message charge. One successfully delivered Copilot response remains one MSG UNIT / 10,000 PWRC.

Runtime boundaries:

```text
frontend → Fastify Copilot/PWRC → OpenAI structured function calls → @powerchain/mcp-client → allowlisted read-only MCP server
                                           ├─ Express internal compatibility gateway
                                           └─ Python/FastAPI internal compatibility gateway
```

Production rules include explicit host and tool allowlists, HTTPS, DNS/private-address checks, credential-field egress blocking, bounded schemas/arguments/results, timeouts, durable invocation hashes/audit, and untrusted-result prompting.

Frontend TypeScript uses a checked-in editor bootstrap at `frontend/expo/tsconfig.base.json`; `frontend/tsconfig.expo.json` validates against the official installed Expo base after `pnpm install`.

## Mobile API namespace and CORS

The Expo client now uses the compatibility namespace:

```text
/api/v1/capilot-mobile
```

with a correctly spelled alias:

```text
/api/v1/copilot-mobile
```

Only explicitly reviewed mobile-safe API roots are rewritten to canonical
`/api/v1/*` handlers. `/internal/*` routes are not mirrored.

CORS configuration is centralized and exposes safe diagnostics at:

```text
GET /api/v1/capilot-mobile/cors/
```

See `docs/API-NAMESPACE-CORS.md`.

The frontend editor config remains dependency-independent:

```json
"extends": "./expo/tsconfig.base.json"
```

while `frontend/tsconfig.expo.json` validates against the installed official
Expo base after `pnpm install`.
