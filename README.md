# PowerChain Copilot Mobile

Production-oriented Expo application foundation for the PowerChain Copilot mobile experience.

## Stack

- Expo SDK 57
- React Native 0.86
- React 19.2
- Expo Router with typed routes
- TypeScript strict mode
- pnpm 11.24.0
- EAS-compatible configuration

The application intentionally does not invent network, wallet, balance, telemetry, or settlement state. Until a backend is configured, operational surfaces render a clear `Not configured` state.

## Requirements

- Node.js 22.13+ (Node 22 LTS recommended for the SDK 57 line)
- Corepack
- Xcode for iOS native builds
- Android Studio for Android native builds

## Install

```bash
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install
cp .env.example .env.local
```

### MCP SDK install note

This release uses the MCP TypeScript SDK v2 split package `@modelcontextprotocol/client@2.0.0`. Do **not** change it back to `@modelcontextprotocol/sdk@^2.0.0`: the monolithic `@modelcontextprotocol/sdk` package is the v1 line and has no published 2.x release. Run `pnpm verify:mcp-sdk` to catch that regression before install/release.

The project intentionally remains on ESLint 9 while Expo SDK 57's current `eslint-config-expo` dependency chain still includes `eslint-plugin-react` versions that are not fully compatible with ESLint 10. The npm EOL warning is non-fatal; do not force ESLint 10 until the Expo lint stack supports it cleanly.

Use the public development contract in `.env.development.example`. The canonical API variable is:

```dotenv
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

`EXPO_PUBLIC_API_BASE_URL` remains accepted as a compatibility alias. For Android emulators or physical devices, replace the loopback host with the appropriate emulator/LAN address while preserving `/api/v1`.

Do not put API keys, private keys, wallet seed phrases, service-role keys, or other secrets in `EXPO_PUBLIC_*` variables. Expo public variables are compiled into the client bundle.

## Development

```bash
pnpm start
pnpm ios
pnpm android
pnpm web
```

For native Continuous Native Generation:

```bash
pnpm prebuild
pnpm native:ios
pnpm native:android
```

Generated `ios/` and `android/` directories are ignored and should be regenerated from the Expo app config unless the project later adopts a deliberate bare/native workflow.

## Quality gates

```bash
pnpm check
pnpm doctor
```

`pnpm check` now verifies the configuration contract first, then runs ESLint plus separate strict TypeScript checks for the Expo app, Fastify server, Express MCP gateway, operations API, and docs workspace. `pnpm doctor` runs Expo Doctor against the installed dependency graph.

The first successful `pnpm install` should generate `pnpm-lock.yaml`. Commit that lockfile before release builds and switch CI to `pnpm install --frozen-lockfile` once it exists.

## Application structure

```text
apps/mobile/
  app/                 Expo Router routes only
  components/
    chat/               Copilot chat UI
    common/             Reusable mobile UI primitives
    operations/         Operational/twin/alarm UI
  config/               Public runtime configuration
  constants/            Theme and product constants
  context/              Auth, role, theme and site context
  hooks/                Stateful application hooks
  lib/                  Transport and low-level utilities
  services/             Backend adapters and domain clients
  types/                Canonical application contracts
  skills/               Copilot operational skill documents
  app.config.ts         Expo application configuration
  tsconfig.json         Extends expo/tsconfig.base
```

Routes stay thin. Product logic belongs in hooks/services and reusable UI belongs in components.

## Copilot API contract

The mobile adapter currently targets:

```text
POST /api/v1/copilot/responses
```

Request:

```json
{
  "message": "Summarize operational risk for this asset",
  "conversationId": "optional-existing-conversation-id"
}
```

Accepted response text fields are `message`, `outputText`, or `output_text`, with an optional `conversationId`. If the server contract changes, update `apps/mobile/services/copilot.ts` rather than coupling screens directly to API payloads.

## Release checklist

1. Configure production `EXPO_PUBLIC_API_URL` in the EAS environment (the legacy `EXPO_PUBLIC_API_BASE_URL` alias remains supported).
2. Generate and commit `pnpm-lock.yaml`.
3. Run `pnpm check` and `pnpm doctor`.
4. Run `pnpm prebuild` and validate both native projects.
5. Test authentication, API timeouts, offline/error states, deep links, and keyboard/safe-area behavior on real devices.
6. Configure store icons, splash assets, privacy declarations, signing, and EAS project identifiers before submission.

## Security baseline

See [SECURITY.md](./SECURITY.md). The client never treats locally displayed status as authoritative evidence for financial or energy operations; privileged actions must be verified and authorized by server-side policy and wallet controls.

## PWRC Copilot credits

This repository now includes the PWRC Copilot credit kernel and the mobile Credits surface.

Core properties:

- 9-decimal integer PWRC base-unit accounting with `bigint` domain values and decimal-string JSON.
- User-scoped `available`, `reserved`, `spent`, and `funded` balances.
- Append-only ledger with Postgres update/delete protection.
- SHA-256 deterministic quote hashes.
- Persist canonical quote -> atomic reserve -> generate -> durably persist completed response -> atomic settle lifecycle for completed Copilot responses.
- Automatic release on generation failure plus user-scoped expiry recovery on account reads and batch recovery for workers.
- HTTP `402 INSUFFICIENT_PWRC_CREDITS` before generation when funds are insufficient.
- One-time sample grant: `1,000,000 PWRC = 100` response credits.
- Authenticated pricing, account, ledger, quote, grant, and top-up endpoints.
- PWRC Solana Pay funding intents with user-scoped `Idempotency-Key` support and authenticated status polling.
- Credit funding only from an HMAC-authenticated, replay-window-checked Payment Kernel `payment.settled` event bound to the exact top-up recipient and Solana Pay reference.
- Canonical Solana mainnet-beta Token-2022 mint identity and Solana Explorer access.
- Authenticated credit state injected into Copilot grounding.
- Dedicated PWRC Credits prompts in the Prompt Library.

The mobile application never stores authoritative credit balances locally. Its `AuthSessionProvider` expects the product authentication flow to set a server-issued `{ userId, accessToken }` session; no bearer token belongs in `EXPO_PUBLIC_*` configuration.

See [docs/PWRC_CREDITS.md](./docs/PWRC_CREDITS.md) for the accounting model, API contract, Payment Kernel webhook, Solana Pay flow, Postgres migration, and integration details.

### Credit kernel tests

```bash
pnpm test:credits
```

The 25-test PWRC suite verifies base-unit arithmetic, the 100-response sample grant, deterministic/tamper-checked quote hashing, persisted-quote preconditions, organization/account scope, durable-response preconditions, exactly-once terminal transitions, Ed25519 receipt signatures/hash chaining, provider-failure release, expiry recovery, HTTP 402 behavior, top-up verification, compensating refunds, and retryable Merkle-root anchoring. `pnpm verify:billing` adds release-structure tests and the static lifecycle verifier.

## Managed AI + infrastructure runtime

Version `1.0.0` now includes a production backend/runtime layer rather than environment-only placeholders.

```text
PowerChain Copilot Mobile
  -> Fastify API
  -> one PWRC quote + reservation
  -> Managed AI Router
       -> OpenAI Responses
       -> Anthropic Messages
       -> DeepSeek Responses-compatible API
       -> Llama / Ollama / vLLM
       -> Emergent-compatible gateway
  -> structured MCP function calls
  -> policy + explicit per-server tool allowlists
  -> approved read-only MCP execution
  -> untrusted tool-result boundary
  -> durably persisted completed response
  -> atomic Reserved→Spent settlement
  -> signed receipt + Solana anchor outbox
  -> exactly one 10,000 PWRC charge
```

Provider fallback is inside the existing reservation. It never creates a second quote, reservation, or charge. If generation ultimately fails, the reservation is released.

Runtime additions include:

- Fastify production API with `/health/live` and readiness based on configured managed AI providers.
- Managed provider routing for OpenAI, Anthropic, DeepSeek, Llama-compatible local inference, and Emergent-compatible gateways.
- Structured model tool calls; no assistant-text JSON tool parser.
- TypeScript MCP client plus authenticated Express and Python/FastAPI internal gateways.
- Fail-closed production MCP host/tool allowlists, DNS/IP SSRF checks, read-only metadata enforcement, request/schema/argument/result limits, credential-field egress blocking, and durable invocation audit.
- Explicit Solana devnet/mainnet-beta profiles with `auto | public | helius | custom` RPC selection.
- Canonical Solana + Metaplex program identities and optional validated PowerChain deployment IDs.
- Canonical PWRC Token-2022 mainnet-beta identity retained independently from the app's devnet operational cluster.
- Sui devnet/testnet/mainnet RPC profiles.
- PostgreSQL/Prisma as authoritative transactional state, optional MongoDB auxiliary storage, and optional Redis distributed rate limiting.
- Opaque or HS256 JWT bearer sessions backed by revocable PostgreSQL sessions.
- AES-256-GCM protected server settings.
- Sanitized Solana system endpoints that disclose configuration identity/status but never RPC URLs, provider keys, database URLs, or AI secrets.
- Compatibility API prefixes for `/api/v1/*`, `/api/v1/capilot-mobile/*`, and `/api/v1/copilot-mobile/*`.

Environment templates:

- `.env.development.example` — Expo/public development contract.
- `.env.server.example` — server/provider/network/database/auth/rate-limit/MCP contract.
- `.env.example` — safe local starting point.

The invalid shell variable spelling `POWERCHAN_:CREDIT_TOKEN` is intentionally unsupported. The canonical setting is `POWERCHAIN_CREDIT_TOKEN=PWRC`.

See [docs/PROVIDER_INFRASTRUCTURE.md](./docs/PROVIDER_INFRASTRUCTURE.md) for the full runtime architecture and security boundaries.

### Backend verification

```bash
pnpm verify:backend
```

This runs the PWRC, MCP, managed-provider, infrastructure, and Python gateway suites plus static provider/infrastructure invariants. Dependency-bound `pnpm check`, Prisma validation/generation, and Expo Doctor should also run after `pnpm install` produces the lockfile.

## Documentation application and whitepaper

The repository now includes a dedicated technical documentation surface under `apps/docs/` plus reusable documentation primitives and brand assets:

```text
apps/docs/                      Next.js static documentation application
components/docs/                Composed documentation sections
shared/components/ui/docs/      Reusable docs cards, figures, callouts, metrics
shared/ui/logo.tsx              Shared PowerChain logo primitive
shared/ui/icons.tsx             Shared line icon set
public/images/brand/            Canonical brand and app icon assets
public/images/mockups/          Mobile UI mockups
public/images/illustrations/    Architecture and credit-flow illustrations
public/images/illustractions/   Compatibility alias for requested path
public/icons/                   Favicons and platform icon sizes
public/assets/                  Whitepaper DOCX, PDF and cover
references/                     Architecture, token, design and standards references
```

Run the documentation app:

```bash
pnpm docs:dev
```

Build the static documentation site:

```bash
pnpm docs:build
```

The generated whitepaper deliverables are:

- `public/assets/powerchain-copilot-mobile-whitepaper.docx`
- `public/assets/powerchain-copilot-mobile-whitepaper.pdf`

The docs application links directly to the PDF and the canonical PWRC Explorer view.

## App icons and brand assets

PowerChain Copilot Mobile 1.0.0 includes the integrated launcher/brand pack under `assets/icon-pack/`:

- iOS light, dark and tinted 1024×1024 icon masters;
- Android adaptive foreground/background plus Android 13+ monochrome source;
- dedicated 96×96 Android notification glyph;
- branded Expo splash assets;
- favicon, Apple touch, PWA, maskable and Windows tile exports;
- iOS AppIcon, Android density, store and desktop export resources;
- theme-aware in-app PowerChain brandmark components.

Run `pnpm verify:icons` after any icon or app-config change. This validation is static; it does not claim a fresh native iOS/Android build.

## EMS / IoT / DePIN operations integration

Version `1.0.0` now includes an isolated operational backend contract for EMS, IoT, DePIN, wallets, chain reads and market data. The public Fastify surface remains the stable mobile API; `backend/operations-api/` is an independently buildable Express + Prisma + optional Supabase workspace behind an internal bearer boundary.

Key additions:

- source/freshness-aware EMS overview service;
- site-scoped IoT and DePIN services with database-backed access checks;
- provider-neutral auth and public-wallet registry adapters;
- read-only Solana and Sui JSON-RPC clients;
- provider-neutral HTTP market-data client;
- sanitized `GET /api/v1/health` and `GET /api/v1/config`;
- idempotent safe-action preparation with review/wallet-signature gates;
- mobile operational hooks and reusable source/status/action components;
- compatibility aliases under `/api/v1/capilot-mobile/*` and `/api/v1/copilot-mobile/*`.

No safe-action route directly dispatches physical equipment or signs blockchain transactions. See [docs/OPERATIONS_INTEGRATION.md](./docs/OPERATIONS_INTEGRATION.md).
Verification evidence: [docs/OPERATIONS_VERIFICATION.md](./docs/OPERATIONS_VERIFICATION.md).

## Operations hardening v1.0.0

The EMS/IoT/DePIN layer now adds site discovery, bounded cursor pagination, alarms, append-only events, a read-only site digital twin, idempotent provider ingestion, source sequence tracking, request-bound safe-action idempotency, resource-level action authorization, bounded provider I/O, request IDs, and a mobile stale-while-revalidate cache.

Canonical public routes remain under `/api/v1/*` with `/api/v1/capilot-mobile/*` and `/api/v1/copilot-mobile/*` compatibility aliases. Provider ingestion stays private inside `backend/operations-api/` and is intentionally not proxied through the public Fastify surface.

See [docs/OPERATIONS_HARDENING.md](./docs/OPERATIONS_HARDENING.md) and [docs/OPERATIONS_INTEGRATION.md](./docs/OPERATIONS_INTEGRATION.md).

## Platform hardening v3 — chat, memory, roles and diagnostics

Version `1.0.0` now also includes:

- managed routing across OpenAI, Anthropic, Gemini, DeepSeek, Ollama/Llama-compatible runtimes, GRIDLLM and the existing Emergent-compatible adapter;
- encrypted user-scoped chat persistence with conversation IDs, stable slugs, content hashes and no plaintext-at-rest message column;
- encrypted, bounded AI memory with credential-pattern blocking and a strict rule that memory is context rather than live operational truth;
- explicit CORS allowlist policy under `server/src/cors/` plus sanitized `/api/v1/cors` status;
- authenticated `/api/v1/diagnostics` with provider, chat, operations, Solana, Sui and rate-limit readiness without secrets;
- deployment-local LoRA registry under `server/lora/`, disabled by default and rejecting remote adapter URLs;
- MCP task-agent profiles under `server/src/mcp/agents/` that only narrow model-visible read-only tools and never grant authorization;
- shared `storage/`, `store/` and `utils/` modules for provider-neutral reusable state infrastructure;
- five visible responsive tabs: Copilot, Command, Assets, Alerts and Profile;
- authenticated role-oriented surfaces for operator, asset manager, maintenance, treasury and admin presentation;
- explicit Light / Carbon Dark / System theme selection;
- mobile skill contracts in `apps/mobile/skills/SKILLS.md`, `CHARACTERS.md`, `CAPILOT.md` and `COPILOT.md`.

The PWRC metering invariant is unchanged: provider fallback, approved MCP calls, memory grounding and operational context happen inside one reservation; only a completed delivered response settles `10,000 PWRC`.

See [docs/PLATFORM_HARDENING_V3.md](./docs/PLATFORM_HARDENING_V3.md).

## PWRC Credit Kernel v4

PWRC credits are server-authoritative 9-decimal integer accounting. One completed, delivered Copilot response settles exactly **10,000 PWRC** from one reservation. Provider fallback and approved MCP calls remain inside that single message unit. The one-time **1,000,000 sample PWRC** grant is an internal evaluation credit and does not mint or transfer on-chain PWRC.

Run `pnpm verify:credits` to execute the accounting/API regression suite and the static 14-invariant release verifier.

## API v1 / Swagger / Postman platform extension

The v1.0.0 release includes a generated OpenAPI 3.1 contract and Postman collection for the secure platform and operations surfaces:

```text
GET /api/v1/openapi.json
GET /api/v1/swagger
```

Source artifacts live under `docs/api/`. Run `pnpm api:docs` to regenerate and `pnpm verify:api-v1` to validate the contract.

The extension covers encrypted user-scoped chat/memory, sanitized LLM/LoRA/agent state, AI provider readiness, tenant-scoped site/digital-twin/telemetry-integrity/alarm/event APIs, provider diagnostics and prepare-only Safe Actions.

**Physical execution remains disabled.** `POST /api/v1/actions/execute` intentionally fails closed with `405 PHYSICAL_EXECUTION_DISABLED`; blockchain submission and wallet signing remain outside the server execution boundary.

## Mobile workspace layout

The Expo application now lives under `apps/mobile/` instead of the repository root `src/` tree:

```text
apps/mobile/
├── app/
├── components/
├── services/
├── hooks/
├── config/
├── constants/
├── context/
├── lib/
├── types/
├── skills/
├── app.config.ts
├── expo-env.d.ts
├── package.json
└── tsconfig.json
```

`apps/mobile/tsconfig.json` extends `expo/tsconfig.base`. Root Expo commands delegate to the mobile workspace and load the repository-root `.env.local` before launching Expo. The root `.env.example` is the canonical environment contract; `.env.local` is local-only and git-ignored.

## PWRC quote-to-receipt billing proof chain

Completed Copilot responses now follow the canonical evidence sequence:

```text
SERVER QUOTE
   ↓
canonical quote payload
   ↓
SHA-256 quote hash
   ↓
PERSIST QUOTE
   ↓
ATOMIC RESERVATION
   ↓
AI GENERATION
   ↓
completed response proof
   ↓
durably persist completed response
   ↓
ATOMIC SETTLEMENT — 10,000 PWRC
   ↓
SPENT BALANCE
   ↓
APPEND-ONLY LEDGER
   ↓
TOKENIZED RECEIPT
```

The receipt is an immutable, Ed25519-signed, non-transferable cryptographic billing proof. It is not an SPL token, NFT, wallet balance, or investment asset. Receipt hashes are batched into a Merkle-root transactional outbox for retry-safe Solana anchoring. See `docs/PWRC_BILLING_LIFECYCLE.md` and migration `server/db/migrations/004_pwrc_authoritative_billing_lifecycle.sql`.


## Authoritative PWRC billing v6.3

Product version remains `1.0.0`. The billing path is server-owned and fail-closed: persisted canonical quote → atomic reservation → AI/MCP work → durable completed response → atomic Reserved→Spent settlement → append-only ledger → Ed25519-signed, hash-chained receipt → transactional outbox for batched Solana Merkle anchoring. Delivery ACK remains compatibility/readback only. See `docs/PWRC_BILLING_LIFECYCLE.md`.

## PWRC Copilot credit economics

The configured v1.0.0 reference economics are **1 PWRC = $0.000002** and **1 completed response = 1 MSG UNIT = 10,000 PWRC ≈ $0.02 reference value**. The reference value is not a live market price. Completed responses receive `pmsg_...` accounting identifiers and signed, non-transferable billing receipts. See `docs/PWRC_COPILOT_CREDITS.md` and `docs/PWRC_COPILOT_CREDITS_VERIFICATION.md`.
