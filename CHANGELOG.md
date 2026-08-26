# Changelog

All notable changes to PowerChain Copilot Mobile are documented in this file.

The project follows Semantic Versioning. Internal development iterations do not change the public application version unless a release is intentionally published.

## [1.0.0] - 2026-08-24

### Monorepo organization

- Canonical deployables moved under `apps/`: `mobile`, `api`, `operations-api`, and `mcp-gateway`.
- Python MCP gateway moved under `services/mcp-python`.
- Shared PWRC, MCP, energy contracts, adapters and clients remain under `packages/`.
- Removed duplicated root Expo `app/src/assets/public` compatibility tree.
- Copilot Prisma schema/migrations now live with the owning `apps/api` service.
- Added shared `tsconfig.base.json` and monorepo verification.

### Added

- Expo / React Native mobile application architecture.
- PowerChain Light, Dark, Dark Green, and System themes.
- PowerChain brand logo variants and Expo app-icon assets.
- Compact card, button, input, badge, sheet, and chat radius system.
- Professional Copilot assistant/user message presentation.
- Bot and user message icons.
- Chat loading skeleton and animated typing indicator.
- `0 / 2000` message composer with hard length enforcement.
- Quick prompts, retry states, inline errors, and message actions.
- Typed chart contracts, chart data registry, and centralized formatters.
- Account registration, login, logout, profile, and session APIs.
- Secure mobile session storage integration.
- Resumable onboarding flow.
- Solana RPC support and Android Mobile Wallet Adapter boundary.
- Solana signed wallet-ownership challenge and server verification.
- PWRC, SOL, USDC, EURC, and SUI asset registry.
- Solana and Sui network registry.
- Phantom, Solflare, Backpack, Ledger, WalletConnect, and generic wallet registry.
- `@web3icons/react` integration for Expo Web.
- Native-safe token/network/wallet icon fallbacks for iOS and Android.
- Dedicated PWRC token icon generated from the PowerChain brand mark.
- OpenAI-backed PowerChain Copilot API gateway.
- Persistent Copilot conversations and conversation-list APIs.
- Pyth price-feed integration.
- Birdeye Solana market-data integration.
- Unified market-price endpoint with fresh/cache/stale semantics.
- Provider and database integration health API.
- PostgreSQL + Prisma 7 schema and baseline migration.
- Audit-event persistence.
- Server-side AI rate-limit hook.
- Structural verification script.
- Full-stack integration documentation and production checklist.

### Security

- Server secrets remain outside the Expo client bundle.
- Session tokens are hashed before persistence.
- Passwords use `scrypt` hashing.
- Wallet ownership requires signed challenge verification.
- Wallet private keys remain exclusively in the user's wallet.
- Mainnet transaction authorization remains outside autonomous AI control.

### Documentation

- Consolidated repository README for release 1.0.0.
- Added app, server, Prisma, and documentation READMEs.
- Added release version file.
- Added MIT license.

[1.0.0]: https://github.com/powerchain-protocol/powerchain-capilot-mobile-app/releases/tag/v1.0.0

### Improved

- Converted the repository from an upgrade overlay into a runnable Expo Router application root.
- Added Expo SDK 57 root dependency and script configuration while keeping the public release at 1.0.0.
- Added `app.config.ts`, `eas.json`, `tsconfig.json`, Metro configuration, and Expo type declarations.
- Restored the shared UI primitives referenced by onboarding, chat, integration, and Web3 screens.
- Added a complete authenticated Expo Router shell with login, onboarding resume, primary tabs, Copilot, assets, systems, and settings routes.
- Added centralized mobile environment parsing for API and Solana RPC configuration.
- Added safe-area provider composition.
- Added network connectivity state and an offline banner.
- Added an application error boundary.
- Added notification permission/channel scaffolding without inventing server registration.
- Added a local-import resolution verifier.
- Expanded structural and release verification to validate runnable application files and version consistency.

### Fixed

- Added a dedicated `apps/mobile/` Expo recovery baseline for incomplete local installs.
- Added preflight detection for missing `expo`, `expo/tsconfig.base`, Expo Router, React Native Web, React DOM, and Expo Metro Runtime.
- Added `npm run repair:npm` and `pnpm repair:pnpm`.
- Added web-specific Expo dependencies and Metro web configuration.
- Added a configuration verifier that fails before launch when the Expo dependency tree is incomplete.
- Preserved public application version `1.0.0`.

### Improved

- Added responsive application breakpoints for mobile, tablet, and desktop while keeping release version 1.0.0.
- Added a floating mobile bottom navigation dock.
- Replaced bottom navigation with a persistent application header on tablet and desktop.
- Added responsive screen gutters and maximum content widths.
- Added responsive two- and three-column grids for operational cards.
- Optimized the Copilot composer so it remains above floating mobile navigation.
- Optimized Home, Assets, Systems, and Settings surfaces for tablet and desktop widths.
- Added `ResponsiveGrid`, `ResponsiveHeader`, `FloatingMobileTabBar`, and `useResponsiveLayout`.
- Added responsive-layout documentation.

### Improved

- Fixed responsive classification so wide phones in landscape do not become tablet layouts.
- Added shortest-edge and orientation-aware responsive state.
- Added adaptive Copilot split-view with persistent conversation rail on tablet and desktop.
- Added adaptive modal/dialog behavior: bottom sheet on mobile and centered dialog on larger screens.
- Improved the floating mobile navigation with a stronger Copilot affordance and compact-height mode.
- Added adaptive typography helpers for small phones, tablets, desktops, and increased font scaling.
- Fixed shared chat and chart components to use the active Light, Dark, or Dark Green theme rather than stale static color imports.
- Fixed `ResponsiveGrid` child normalization so fragments and single children behave consistently.
- Added explicit React Navigation bottom-tab dependency for the custom tab bar type boundary.
- Added theme validation to repository verification.

### Fixed

- Converted `apps/mobile/` into a complete standalone Expo application containing its own `app/`, `src/`, `assets/`, `public/`, entrypoint, Metro configuration, environment example, and runtime scripts.
- Added checked-in `apps/mobile/expo/tsconfig.base.json` so VS Code no longer reports a missing Expo TypeScript base before dependencies are installed.
- Added `apps/mobile/tsconfig.expo.json` to validate against the official installed `expo/tsconfig.base` after bootstrap.
- Changed the frontend entrypoint to `index.js` so the React Native crypto polyfill is installed before Expo Router and Solana modules initialize.
- Replaced machine-specific path examples with the canonical GitHub repository URL and repository-relative `cd powerchain-capilot-mobile-app/frontend`.
- Added frontend Node-version, directory, Expo, Router, web-runtime, and Metro preflight checks.
- Added a single `npm run bootstrap` recovery command for install, Expo compatibility alignment, Expo Doctor, and dependency verification.
- Converted the root package into a workspace/orchestration boundary for `apps/mobile` and `apps/api`.
- Added root verification for the frontend application layout and dual TypeScript configuration.
- Kept the public release version at 1.0.0.

### Fixed

- Fixed the repository-root TypeScript configuration so it no longer reports `No inputs were found`.
- Removed the invalid `scripts/**/*.mjs` root TypeScript include.
- Added `types/workspace.d.ts` as the root workspace TypeScript anchor.
- Kept Expo TypeScript compilation owned by `apps/mobile/tsconfig.json`.
- Kept backend TypeScript compilation owned by `apps/api/tsconfig.json`.
- Added explicit frontend and server typecheck scripts.
- Added `scripts/verify-tsconfig-layout.mjs`.

### Added

- Added complete root, frontend, server and production `.env.example` templates.
- Added `npm run env:init` and `npm run env:check`.
- Added PostgreSQL Docker Compose configuration and database lifecycle scripts.
- Added full-stack API + Expo development launcher.
- Added server environment validation for logging, CORS, proxy trust, request body size, sessions, AI rate limits, Solana, Sui, OpenAI, Pyth, Birdeye and market cache policy.
- Added safe `GET /api/v1/config` runtime configuration endpoint.
- Added Sui read-network health integration and `GET /api/v1/sui/health`.
- Added canonical `/health/live` and `/health/ready` endpoints alongside `/api/v1/health/*`.
- Added frontend environment support for app environment, release version, Solana asset overrides, Sui metadata and feature presentation flags.
- Added `docs/ENVIRONMENT.md`.

### Improved

- AI rate limits are now environment-configurable.
- Market-data cache fresh/stale windows are now environment-configurable.
- Solana RPC commitment is now environment-configurable.
- Fastify log level, proxy trust and body-size limits are now environment-configurable.
- PWRC and USDC frontend asset registry addresses can be overridden safely per environment.
- Production environment validation rejects wildcard CORS and localhost frontend API configuration.

### Fixed

- Fixed `ERR_PNPM_NO_MATCHING_VERSION` by replacing `@wallet-ui/react-native-web3js@^1.0.0` with `@wallet-ui/react-native-web3js@4.3.0`.
- Standardized the workspace on pnpm 11.23.0.
- Restored `apps/mobile/tsconfig.json` to the official `expo/tsconfig.base`.
- Removed the duplicate checked-in Expo TypeScript base and duplicate `tsconfig.expo.json`.
- Added dependency regression validation for Wallet UI, Expo and pnpm.
- Converted root apps/mobile/apps/api/Prisma scripts from mixed npm/npx usage to pnpm.
- Added first-class `pnpm exec expo start`, `pnpm exec expo run:ios`, `pnpm exec expo run:android`, and web instructions.
- Added `pnpm run setup` for install, Expo dependency alignment, Expo Doctor and dependency verification.
- Added pnpm build dependency approvals for Prisma, esbuild, sharp and native buffer packages.

### PWRC Copilot Credits

- Added canonical PWRC message-credit lifecycle: quote → reserve → generate → verify → settle/release.
- Added exact 9-decimal PWRC base-unit accounting using `DECIMAL(38,0)` persistence.
- Added deterministic `pwrc-copilot-v1` quote hashes.
- Added user-scoped available, reserved, spent and funded credit balances.
- Added append-only PWRC credit ledger.
- Added persistent reservations and expiry recovery worker.
- Added HTTP 402 `INSUFFICIENT_PWRC_CREDITS`.
- Added one-time development demo grant of 1,000,000 sample PWRC = 100 responses.
- Added authenticated pricing, account, ledger, funding and message-receipt APIs.
- Added Solana Pay top-up intents for 500K / 2.5M / 5M / 10M PWRC presets.
- Added signed Payment Kernel `payment.settled` funding boundary; pending Solana Pay intents do not credit balances directly.
- Added `pmsg_...` accounting receipts for completed Copilot responses.
- Added cancellation/disconnect release handling and explicit Copilot cancel endpoint.
- Added PWRC credit context to AI grounding while marking the $0.000002 value as reference-only, not live pricing.
- Added `/copilot-credits` with balance, runway, economics, token identity, Explorer, low-credit state, funding history and ledger.
- Added composer, quick-prompt and completed-message PWRC pricing/receipt UX.
- Changed credit navigation to `Open PWRC credit center`, which does not consume an AI response.
- Canonical product version remains 1.0.0.

### Improved — PWRC production hardening

- Added delivery acknowledgement before converting reserved PWRC into spent PWRC.
- Added durable `PwrcPendingResponse` records with hashed acknowledgement tokens.
- Added idempotent `POST /api/v1/ai/chat/ack` settlement flow.
- Added abnormal-response transport recovery and expiry release behavior.
- Added Payment Kernel event-id and timestamp replay protection.
- Added configurable Payment Kernel webhook clock-skew window.
- Added append-only Payment Kernel event receipts.
- Added atomic top-up intent claiming before balance mutation to prevent double funding.
- Added per-user top-up idempotency keys.
- Added top-up intent history/status API and wallet-return refresh UX.
- Added user-scoped credit reconciliation API and Credits Center integrity status.
- Expanded PWRC maintenance to expire reservations, pending responses, and top-up intents.
- Added database-level one-time demo-grant concurrency protection.
- Kept the public application version at 1.0.0.
- Added configurable 120-second post-generation PWRC delivery-ACK window.
- Added deterministic `/api/v1/ai/chat/recover` delivery/accounting recovery without regeneration or duplicate debit.
- Added deterministic Copilot request fingerprints and `COPILOT_IDEMPOTENCY_CONFLICT` protection.
- Added pending-response content/token scrubbing on abandoned expiry/cancellation paths.
- Added strict Payment Kernel event/settlement conflict detection for idempotency-key reuse with different evidence.
- Made verified Solana transaction signature mandatory for `payment.settled` credit funding.
- Added database immutability triggers for settled message receipts and PWRC funding records.
- Added terminal reservation state/economic-identity mutation guard.
- Isolated PWRC maintenance failures with a non-overlap guard and `Promise.allSettled` execution.

### Improved — coherent PWRC accounting module

- Added `@powerchain/pwrc-credits` as the canonical shared credit-domain package.
- Centralized PWRC mainnet-beta, Token-2022, mint and 9-decimal identity.
- Added canonical decimal-string JSON contracts for all PWRC base-unit values.
- Added bigint-only pure accounting functions and funded-balance conservation checks.
- Added deterministic quote construction and authenticated `GET /api/v1/credits/quote`.
- Added pure verified-settlement replay compatibility rules used by the Payment Kernel boundary.
- Hardened `payment.settled` validation to require canonical positive base-unit strings and valid base58 32-byte Solana keys/references plus a 64-byte transaction signature.
- Added mainnet PWRC mint and Token-2022 environment invariants.
- Added bounded recent-ledger and quote metadata to Copilot grounding.
- Added dedicated PWRC credit prompts while keeping credit-center navigation non-AI and non-billable.
- Added executable core accounting tests for grant arithmetic, message cost, reserve/settle/release, insufficient balance, deterministic quotes, decimal-string boundaries and settlement idempotency.
- Kept the canonical product and module version at `1.0.0`.
- Added a database unique guard for verified Solana transaction signatures and `PAYMENT_TRANSACTION_ALREADY_USED` conflict handling.

### Improved — PWRC credit accounting hardening

- Bound deterministic Copilot quotes to quote schema, billing trigger, PWRC asset identity, Solana network, mint and Token-2022 program.
- Persisted immutable quote snapshots on reservations so idempotent replay and historical settlement never depend on current pricing constants.
- Persisted token/network identity on message receipts and message-pricing identity on funding/top-up records.
- Changed account, funding and top-up display amounts to exact 9-decimal PWRC formatting instead of integer token division.
- Added cross-table reconciliation controls for settled receipts, SETTLE ledger postings, settled reservations, funding rows and FUNDING ledger postings.
- Added optional Token-2022 transfer evidence fields with database arithmetic enforcement when supplied by the Payment Kernel.
- Added compare-and-swap delivery-token rotation so concurrent recovery is surfaced as `COPILOT_RECOVERY_RACE` instead of silently returning an already-invalidated acknowledgement token.
- Added resilient PWRC Credits provider state with stale-data/error indication and retry UX.
- Kept application, frontend, server and shared PWRC package versions at 1.0.0.

### MCP / TypeScript hardening

- Added checked-in `apps/mobile/expo/tsconfig.base.json` and changed `apps/mobile/tsconfig.json` to extend `./expo/tsconfig.base.json` so VS Code works before dependencies install.
- Added `apps/mobile/tsconfig.expo.json` for post-install validation against Expo's official package base.
- Added MCP v2 client package using `@modelcontextprotocol/client@2.0.0`.
- Added structured OpenAI Responses function-calling loop for read-only MCP tools.
- Added MCP host/tool allowlists, HTTPS/SSRF checks, credential egress guards, tool/schema/result limits and timeouts.
- Added durable MCP invocation audit persistence.
- Added Express 5.2.1 internal MCP gateway and Python/FastAPI gateway using `mcp==2.0.0`.
- Preserved Fastify as the only public Copilot/PWRC billing authority.

### Improved — frontend TypeScript / API namespace / CORS

- Kept `apps/mobile/tsconfig.json` on the checked-in `./expo/tsconfig.base.json` editor bootstrap.
- Added React Native custom condition support to the local Expo bootstrap base.
- Preserved `apps/mobile/tsconfig.expo.json` for validation against the official installed Expo base.
- Added `/api/v1/capilot-mobile/*` as the Expo/mobile API compatibility namespace.
- Added `/api/v1/copilot-mobile/*` as the corrected spelling alias.
- Added fail-closed mobile route rewriting so internal API routes are never automatically mirrored.
- Changed frontend development/production API defaults to the mobile namespace.
- Centralized CORS policy, allowed/exposed headers, methods, localhost development behavior and preflight caching.
- Added safe `GET /api/v1/cors` and namespaced `/cors/` diagnostics.
- Added production validation rejecting wildcard/localhost CORS configuration.
- Added `scripts/verify-api-namespace.mjs`.

- CORS origin entries now fail environment validation if they contain paths, queries, fragments, credentials, or non-HTTP(S) schemes.
- Added executable mobile namespace rewrite tests, including `/cors/`, corrected alias, and fail-closed internal/admin paths.

## 1.0.0 — Managed providers, network profiles and infrastructure hardening

- Added managed AI provider routing for OpenAI, Anthropic, DeepSeek, Llama-compatible endpoints and Emergent-compatible managed endpoints.
- Preserved structured read-only MCP tool calling across provider adapters.
- Added deterministic provider fallback without additional PWRC message charges.
- Updated the Expo development API default to `http://127.0.0.1:8000/api/v1` and added `EXPO_PUBLIC_NETWORK`, `EXPO_PUBLIC_DATA_MODE`, and `EXPO_PUBLIC_AI_MODE`.
- Added `POWERCHAIN_CREDIT_TOKEN=PWRC` and `POWERCHAIN_MINT` compatibility configuration.
- Added devnet/mainnet-beta Solana RPC profiles, public/Helius/custom provider selection and safe Helius key-derived RPC endpoints.
- Added sanitized `GET /api/v1/system/solana` runtime metadata without exposing RPC secrets.
- Added standard Solana and Metaplex program registries; PowerChain program IDs remain explicit deployment inputs rather than invented defaults.
- Added optional MongoDB health integration and Redis-backed distributed rate limiting.
- Added global/auth/AI rate-limit policy.
- Added optional signed JWT presentation while preserving revocable database sessions.
- Added AES-256-GCM settings encryption helper.
- Added network-specific Sui endpoint selection.
- Expanded environment verification and production fail-closed validation.

### Interaction design upgrade

- Replaced the previous navigation with a strict five-tab model: Overview, Actions, Copilot, Assets and Systems.
- Moved Settings out of primary navigation into a dedicated system route.
- Added the Action Center tab and dedicated Service Health screen.
- Rebuilt Assets as an operational portfolio surface with navigable asset-detail routes.
- Added purpose-built toolbars and centralized route constants for every primary CTA.
- Added batch approval review, reports, settlement review, diagnostics, settings and action/asset detail routes.
- Added demo-only operational data guarded by `EXPO_PUBLIC_DATA_MODE=demo`; live/tba modes do not fabricate asset/action state.
- Added sanitized diagnostics combining runtime config, Solana metadata, CORS, MCP and PWRC reconciliation reachability.
- Added MCP Gateway to service-health configuration status.
- Reworked Carbon Dark theme surfaces while retaining the `darkGreen` compatibility key.
- Replaced the app/header green brand asset and generated Expo/iOS/adaptive/favicon assets from the supplied PowerChain logo.
- Removed dead mobile Copilot header controls when callbacks are not wired.

## App icon integration — 2026-08-26

- Integrated the verified PowerChain icon pack without redrawing the artwork.
- Added iOS light, dark and tinted icon variants.
- Added Android adaptive foreground, monochrome themed icon and notification icon.
- Added web favicon, PWA maskable icons, Apple touch icon and Windows tile assets.
- Replaced in-app header marks with exact transparent light/dark pack masters.
- Added icon-path and PNG-dimension verification.
- Product/app version remains 1.0.0.

### Shared application infrastructure

- added `src/shared`, `src/storage`, `src/store`, and expanded `src/utils`
- centralized application errors and HTTP error mapping
- centralized PWRC/Solana/Metaplex public token constants
- added semantic brand/icon/PWRC asset registry
- added SecureStore-backed session storage and small preference persistence
- added dependency-free external store primitive using `useSyncExternalStore`
- added session and role/organization preference stores
- refactored API authentication persistence through the shared session store
- added import aliases `@shared`, `@storage`, `@store`, and `@utils`
- added `verify:shared` architecture validation


### Energy platform modularization

- Added `@powerchain/energy-contracts` for EMS, IoT, DePIN, auth, wallet, market, health and safe-action contracts.
- Added provider-neutral auth and wallet adapters.
- Added provider-neutral Solana, Sui and backend market-data clients.
- Added Energy/IoT/DePIN frontend services, hooks, operational components and routes.
- Added safe-action preview/confirm flow with fail-closed execution and UNKNOWN transport handling.
- Added isolated `apps/operations-api` workspace using Express, Prisma/PostgreSQL and optional Supabase Auth.
- Added `/api/v1/health`, `/api/v1/config`, EMS, IoT, DePIN and safe-action API routes to the isolated backend.
- Preserved the existing deployed Copilot/Fastify API and product version 1.0.0.

### Frontend TypeScript bootstrap correction

- Confirmed `apps/mobile/tsconfig.json` extends the checked-in `./expo/tsconfig.base.json`.
- Preserved `apps/mobile/tsconfig.expo.json` for post-install validation against the official `expo/tsconfig.base`.


### API v1 documentation architecture

- Added `apps/api/v1/` canonical Fastify registration boundary.
- Added OpenAPI 3.1 contract `powerchain-capilot.yaml`.
- Added Postman collection and local/devnet/mainnet environment templates.
- Added Swagger UI and runtime contract endpoints.
- Added API contract verification.

### Operational intelligence & truth hardening

- Added per-site digital twin, deterministic flow-balance validation and reusable evidence envelopes.
- Added sequence-aware telemetry ingestion receipts with SHA-256 hashing, idempotency conflict rejection and late-update auditing.
- Added operational alarms and append-only event journal with bounded cursor APIs.
- Hardened Safe Actions with resource authorization, wallet ownership, request hashing, expiry and fail-closed dispatch simulation.
- Added provider response bounds, timeouts, redirect rejection and DB/Solana/Sui/market readiness checks.
- Added `/api/v1/sites`, `/alarms`, `/events`, `/twin`, `/flow/validate` and JSON evidence/snapshot exports through the Fastify gateway while private ingestion remains isolated.
- Added encrypted user-message storage, `/api/v1/chat/:conversationId/messages`, `ai/memory`, `llm`, `lora`, and bounded `mpc/agents` namespaces.
- Added mobile site selector, SWR cache, request deduplication, AppState refresh, digital-twin summary, real alarm/event feeds and `⌘/Ctrl+K` command menu.
- Added mobile Copilot skill/character/instruction files while preserving the requested `CAPILOT.md` compatibility filename.
- Physical equipment execution and server-side transaction signing remain disabled.
