# PowerChain Copilot Mobile v1.0.0 — Provider & Infrastructure Verification

> Historical verification snapshot. The current authoritative PWRC billing lifecycle is documented in `PWRC_BILLING_LIFECYCLE.md`; delivery ACK is now compatibility/readback only.

Verification date: **2026-08-25**

The provider/infrastructure release was verified from the final source tree after the managed AI, MCP, PWRC delivery-ACK, Solana/Sui, persistence, authentication, encryption, rate-limit, and compatibility-route changes were applied.

## Passing suites

| Gate | Result |
| --- | ---: |
| PWRC accounting / Payment Kernel / delivery ACK | 15 / 15 |
| MCP shared policy/security | 4 / 4 |
| Structured MCP Copilot loop | 2 / 2 |
| Managed provider router | 3 / 3 |
| Infrastructure/security | 8 / 8 |
| Python gateway security | 4 / 4 |
| Total executable tests | **36 / 36** |
| TypeScript/TSX syntax transpilation | **115 files, 0 errors** |
| JSON parsing | 7 files |
| TOML parsing | 1 file |
| Python compileall | passed |
| Provider/infrastructure static invariants | passed |

## Verified invariants

- One Copilot request creates one PWRC quote/reservation before provider or MCP execution.
- Managed-provider fallback remains inside that reservation and cannot multiply the PWRC charge.
- Successful delivery is settled only after the authenticated delivery ACK; provider failure releases the reservation.
- Managed tool execution is structural function calling, not parsing assistant text.
- MCP results are treated as untrusted model context.
- Production MCP requires explicit hostname allowlisting and explicit non-empty per-server `allowedTools`.
- Operator allowlist and external `readOnlyHint=true` are both required for execution.
- Python MCP code is isolated under `backend/python/`.
- Canonical PWRC identity remains Token-2022, 9 decimals, mainnet-beta.
- The public Solana system API does not expose RPC URLs, Helius credentials, database URLs, or AI-provider credentials.
- JWT mode fails closed without a sufficiently long secret; Redis rate limiting fails closed without Redis configuration.
- Prisma v7 connection selection is handled by `prisma.config.ts`; removed `datasource.directUrl` syntax is not used.

## Dependency-bound gates

This environment does not contain the project dependency installation or a generated `pnpm-lock.yaml`. Therefore the following gates remain release-machine/CI gates after `pnpm install`:

```bash
pnpm check
pnpm doctor
pnpm prisma:validate
pnpm prisma:generate
pnpm prisma:migrate:status
pnpm docs:build
```

Commit the generated `pnpm-lock.yaml` and use `pnpm install --frozen-lockfile` in CI once the dependency graph is resolved.
