# PWRC Copilot Credits v1.0.0 — Verification

Verification date: **2026-08-26**

This verification covers the authoritative PWRC billing lifecycle plus the improved configured reference economics and MSG UNIT presentation layer.

## Verified economics

- PWRC decimals: **9**
- One completed Copilot response: **10,000 PWRC**
- Base-unit debit: **10,000,000,000,000**
- Configured initial/reference value: **1 PWRC = $0.000002**
- One completed response reference value: **$0.02**
- `$1.00 reference value = 500,000 PWRC = 50 responses`
- Reference-value calculations use integer micro-USD arithmetic server-side; no floating-point value determines a PWRC debit.
- The configured reference value is explicitly not a live market price.

## Verified message-unit behavior

- A successful response receives a server-generated `pmsg_...` accounting id.
- `1 completed response = 1 MSG UNIT = 10,000 PWRC`.
- Managed provider fallback and approved read-only MCP calls remain inside the same reservation and do not create extra MSG UNIT charges.
- The signed receipt v1 contract remains unchanged.
- Request idempotency, quote hash, reservation id, message-unit id, receipt id/hash, PWRC debit, and configured reference value are linked in the server-produced message-unit envelope.
- Encrypted assistant chat rows preserve proof metadata for historical conversation retrieval without copying plaintext content into billing records or Solana anchors.

## Final regression

| Gate | Result |
| --- | ---: |
| PWRC / authoritative billing | 29 / 29 |
| MCP shared security | 4 / 4 |
| Structured MCP Copilot loop | 2 / 2 |
| Managed provider router | 3 / 3 |
| Infrastructure/security | 8 / 8 |
| Operations | 20 / 20 |
| Secure platform/chat/memory | 6 / 6 |
| API-v1 | 3 / 3 |
| Python MCP security | 4 / 4 |
| **Total executable tests** | **79 / 79** |
| TypeScript/TSX syntax | **256 files, 0 errors** |
| Workspace/config/icons/static verifiers | **passed** |
| OpenAPI/Postman regeneration | **passed** |

## Dependency-bound release gates

A real package installation is still required before claiming a full Expo/Next/Prisma dependency-aware build. On a networked development/CI machine run:

```bash
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install
pnpm check
pnpm doctor
pnpm prisma:validate
pnpm prisma:generate
pnpm prisma:migrate:status
pnpm docs:build
```

The source-level regression above does not substitute for signed iOS/Android builds or production database/provider smoke tests.
