# Installation and MCP SDK compatibility

## Fixed resolver failure

`@modelcontextprotocol/sdk@^2.0.0` is invalid. MCP TypeScript SDK v2 split the monolithic v1 package into dedicated packages. PowerChain only needs a client in the canonical backend path, so the root now depends on `@modelcontextprotocol/client@2.0.0`.

The Express internal gateway did not import MCP SDK code, so its dead `@modelcontextprotocol/sdk` dependency was removed.

## Runtime migration

`packages/mcp-client/client.ts` now imports `Client` and `StreamableHTTPClientTransport` from `@modelcontextprotocol/client`. The client opts into `versionNegotiation: { mode: 'auto' }`, which probes the modern 2026-07-28 protocol and falls back to the legacy handshake when required. Existing PowerChain allowlists, read-only policy, schema/result bounds, SSRF checks, and execution-time re-discovery remain authoritative.

## Environment compatibility

The server now accepts the current environment names used by `.env.example`, including `SOLANA_*_PROGRAM_ID`, `SUI_RPC_*_URL`, `CORS_ORIGINS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, and `AI_REQUEST_TIMEOUT_MS`, while retaining previous aliases for compatibility.

`SOLANA_RPC_URL` and `SUI_RPC_URL` remain explicit overrides; the backend can resolve the selected network from the per-network URLs without relying on shell-style `${VAR}` expansion.

## Verification

Run:

```bash
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install
pnpm verify:mcp-sdk
pnpm check
pnpm test
```

The first successful install should generate `pnpm-lock.yaml`; commit it and use `pnpm install --frozen-lockfile` in CI afterward.
