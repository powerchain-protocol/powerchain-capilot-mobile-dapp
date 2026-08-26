# Operations Hardening Verification

> Historical verification snapshot. The current authoritative PWRC billing lifecycle is documented in `PWRC_BILLING_LIFECYCLE.md`; delivery ACK is now compatibility/readback only.

Release: `1.0.0`

Verified from the final source tree after the EMS/IoT/DePIN operational-hardening pass:

- PWRC accounting and delivery ACK: 15/15
- MCP security/policy: 4/4
- structured Copilot MCP loop: 2/2
- managed AI providers: 3/3
- infrastructure/security: 8/8
- EMS/IoT/DePIN/alarms/events/twin/ingestion/safe-action tests: 19/19
- Python MCP security: 4/4
- **total executable tests: 55/55**
- TypeScript/TSX syntax transpilation: 189 files, 0 syntax diagnostics
- JSON/TOML validation: passed
- Python compilation: passed
- provider/infrastructure static verification: passed
- icon-pack verification: passed
- operations hardening static verification: passed

The operations suite specifically verifies:

- fail-closed operations configuration;
- source/freshness/sequence metadata preservation;
- bounded cursor pagination;
- resource-level safe-action authorization;
- cryptographic request binding for safe-action idempotency;
- read-only digital-twin aggregation;
- idempotent provider ingestion and replay detection;
- same-key/different-payload rejection;
- out-of-order IoT heartbeats remain auditable but cannot regress current state;
- internal gateway secret isolation from the public API.

## Dependency-bound release gates

This source tree intentionally does not claim dependency-bound or native build validation without the installed package graph. Run the following on the release machine:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm operations:typecheck
pnpm --filter @powerchain/operations-api prisma:validate
pnpm --filter @powerchain/operations-api prisma:generate
pnpm --filter @powerchain/operations-api prisma:migrate:status
pnpm docs:build
pnpm doctor
```

A signed iOS/Android native build, database migration against production PostgreSQL, and live provider smoke tests are separate deployment gates.
