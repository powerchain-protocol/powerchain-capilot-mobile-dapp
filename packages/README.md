# Shared Packages

- `@powerchain/pwrc-credits` — exact bigint PWRC credit accounting contracts and invariants.
- `@powerchain/mcp-client` — MCP client, policy and security boundary.
- `@powerchain/energy-contracts` — EMS/IoT/DePIN API/domain contracts.
- `@powerchain/platform-adapters` — provider-neutral auth and wallet adapters.
- `@powerchain/platform-clients` — Solana, Sui, market-data and platform clients.

Packages must not depend on deployable `apps/*` projects. Applications may depend on packages.
