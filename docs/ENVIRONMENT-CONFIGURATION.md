# PowerChain Environment & Configuration Architecture v1.0.0

PowerChain treats configuration as a governed runtime boundary, not a collection of arbitrary `process.env` reads.

## Configuration authority

```text
Expo / web public configuration
        ↓
validated client config
        ↓
authenticated API
        ↓
server configuration resolver
        ├── runtime / API
        ├── PostgreSQL / Prisma / Supabase
        ├── Solana / Helius
        ├── PWRC / stablecoins
        ├── Sui
        ├── market-data providers
        ├── managed AI providers
        ├── MCP gateways
        └── observability / feature flags
```

Anything prefixed with `EXPO_PUBLIC_` is treated as public. API keys, database URLs, service-role credentials, HMAC/JWT material and secret-bearing RPC URLs remain server-only.

## Selected-network PWRC resolution

The canonical mainnet-beta PWRC identity is deliberately separated from development configuration.

```env
SOLANA_NETWORK=devnet
PWRC_MINT_MAINNET=PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc
PWRC_MINT_DEVNET=
POWERCHAIN_MINT=
```

The application does **not** substitute the mainnet mint on devnet.

| Selected network | Configured mint | Result |
| --- | --- | --- |
| devnet | blank devnet PWRC mint | Accounting/demo operation is allowed; on-chain PWRC settlement/top-up remains unavailable. |
| devnet | canonical mainnet-beta PWRC mint | Invalid; startup/config validation rejects the mismatch. |
| mainnet-beta | canonical mainnet-beta PWRC mint | Valid production PWRC identity when settlement controls are enabled. |

This prevents a devnet RPC + mainnet asset + production settlement combination from becoming an accidental execution environment.

## PostgreSQL, Prisma and Supabase

PostgreSQL/Prisma remains the authoritative transactional and financial source of record.

```env
DATABASE_URL=
DIRECT_URL=

SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DATABASE_URL=
SUPABASE_DIRECT_URL=
```

`DATABASE_URL` is used for application/runtime traffic. `DIRECT_URL` is kept separately for migration, introspection and administrative operations when a direct connection is required. Supabase SDK credentials are separate from database connection strings. `SUPABASE_SERVICE_ROLE_KEY` is backend-only.

MongoDB is auxiliary/document-oriented. Redis is transient/distributed cache, rate-limit and coordination infrastructure. Neither is a financial source of record.

## Solana program registry

Standard public program IDs are explicit and runtime validated. PowerChain-specific programs remain blank until actual deployed addresses have been verified.

```env
SOLANA_SYSTEM_PROGRAM_ID=11111111111111111111111111111111
SOLANA_TOKEN_PROGRAM_ID=TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
SOLANA_TOKEN_2022_PROGRAM_ID=TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
SOLANA_ASSOCIATED_TOKEN_PROGRAM_ID=ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL
METAPLEX_TOKEN_METADATA_PROGRAM_ID=metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
METAPLEX_BUBBLEGUM_PROGRAM_ID=BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY
SOLANA_ACCOUNT_COMPRESSION_PROGRAM_ID=cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK
SOLANA_NOOP_PROGRAM_ID=noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV

POWERCHAIN_ENERGY_RWA_PROGRAM_ID=
POWERCHAIN_MARKET_PROGRAM_ID=
POWERCHAIN_SETTLEMENT_PROGRAM_ID=
POWERCHAIN_REWARDS_PROGRAM_ID=
POWERCHAIN_TREASURY_PROGRAM_ID=
POWERCHAIN_ACP_PROGRAM_ID=
```

No placeholder or invented PowerChain program ID is treated as executable configuration.

## Token-2022 metadata vs Metaplex

Token-2022 can carry metadata using its own extensions. Metaplex Token Metadata is a separate integration model. PowerChain therefore records/configures the metadata model explicitly instead of assuming that every Token-2022 mint depends on Metaplex.

## Managed AI provider routing

```env
AI_MODE=managed
AI_PRIMARY_PROVIDER=openai
AI_PROVIDER_ORDER=openai,anthropic,gemini,deepseek,ollama,gridllm,emergent

OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
GRIDLLM_BASE_URL=
EMERGENT_LLM_KEY=
```

Provider fallback is an inference concern. It does not multiply PWRC charges; the billing boundary remains one delivery-acknowledged Copilot response per message unit.

## Market data and liquidity

Pyth, Birdeye, CoinGecko, CoinMarketCap and Jupiter are explicit provider integrations with enabled/configured state. No single market-data integration becomes financial truth merely because it is available.

## Sanitized diagnostics

Authenticated operational clients may use:

```text
GET /api/v1/system/solana
GET /api/v1/system/platform
```

These endpoints may expose cluster, RPC provider classification, public program IDs, selected PWRC configuration, database/provider availability and feature state.

They must never expose:

- Helius API keys or secret-bearing RPC URLs
- database connection strings
- Supabase service-role credentials
- JWT/HMAC secrets
- AI provider API keys
- MCP internal secrets
- payment webhook secrets

## Production release checklist

1. Select the deployment network explicitly.
2. Verify the PWRC mint for that network; never rely on cross-network fallback.
3. Verify every configured PowerChain program ID against the deployed program.
4. Validate database and direct/admin connection responsibilities.
5. Disable demo grants and localhost CORS in production.
6. Configure distributed rate limiting for horizontally scaled APIs.
7. Verify provider-health/readiness metadata.
8. Run environment verification before migrations or external execution.
9. Confirm sanitized system endpoints do not expose secrets.
10. Record application, database-schema, adapter and event-schema versions in deployment evidence.
