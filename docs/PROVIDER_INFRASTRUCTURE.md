# PowerChain Copilot Mobile — Provider & Infrastructure Runtime

Version: **1.0.0**

## Canonical request path

```text
Mobile Copilot
  -> Fastify API
  -> one PWRC quote + reservation (10,000 PWRC / 1 MSG UNIT)
  -> Managed AI Router
       -> OpenAI Responses
       -> Anthropic Messages
       -> DeepSeek Responses-compatible API
       -> Llama / Ollama / vLLM OpenAI-compatible chat
       -> Emergent-compatible OpenAI chat gateway
  -> structured function calls
  -> MCP policy + explicit allowlists
  -> approved read-only MCP execution
  -> untrusted tool-result boundary
  -> durably persist completed Copilot response
  -> atomically settle exactly one PWRC reservation
  -> signed receipt + Merkle-anchor outbox
```

Provider fallback occurs **inside the existing reservation**. It never creates another quote or reservation. If all providers fail, the reservation is released. A successful response is durably stored before settlement begins, then settles server-side in a separate atomic transaction before the response is returned. The legacy delivery-ACK route is readback compatibility only and cannot trigger a new charge.

## Managed providers

Server configuration:

```dotenv
AI_PRIMARY_PROVIDER=openai
AI_PROVIDER_ORDER=openai,anthropic,deepseek,llama,emergent
AI_FALLBACK_ENABLED=true
AI_PROVIDER_TIMEOUT_MS=60000
AI_MAX_OUTPUT_TOKENS=4096
AI_REASONING_EFFORT=medium

OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-5.6-terra

ANTHROPIC_API_KEY=
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODEL=
ANTHROPIC_VERSION=2023-06-01

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash

LLAMA_API_KEY=local
LLAMA_BASE_URL=http://127.0.0.1:11434/v1
LLAMA_MODEL=

EMERGENT_LLM_KEY=
EMERGENT_LLM_BASE_URL=
EMERGENT_LLM_MODEL=
```

`OPENAI_BASE_URL` may remain blank; the runtime defaults it to `https://api.openai.com`. Anthropic deliberately requires an explicit model value so deployment does not silently adopt a stale model name. Llama and Emergent are also disabled until a model/base contract is configured.

## Public Expo contract

```dotenv
NODE_ENV=development
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
EXPO_PUBLIC_NETWORK=devnet
EXPO_PUBLIC_DATA_MODE=demo
EXPO_PUBLIC_AI_MODE=managed
EXPO_PUBLIC_SOLANA_NETWORK=devnet
EXPO_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
EXPO_PUBLIC_SOLANA_MAINNET_RPC_URL=https://api.mainnet-beta.solana.com
EXPO_PUBLIC_CREDIT_TOKEN=PWRC
EXPO_PUBLIC_CREDIT_NETWORK=mainnet-beta
EXPO_PUBLIC_PWRC_MINT=PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc
```

`EXPO_PUBLIC_AI_MODE=managed` is enforced by the Copilot UI. The client accepts both the new `EXPO_PUBLIC_API_URL` and the older `EXPO_PUBLIC_API_BASE_URL` alias. URL joining avoids duplicating `/api/v1` when the base URL already contains it.

## Solana runtime

`SOLANA_RPC_PROVIDER` accepts `auto`, `public`, `helius`, or `custom`.

- `public`: selected devnet/mainnet public endpoint.
- `helius`: requires `HELIUS_RPC_URL` or `HELIUS_API_KEY`.
- `custom`: requires `SOLANA_RPC_URL`.
- `auto`: custom URL first, then Helius, then the public endpoint.

When only `HELIUS_API_KEY` is configured, the server derives the selected devnet/mainnet Helius RPC URL. The sanitized system endpoint never returns the API key or RPC URL.

Canonical PWRC credit identity is fail-closed:

```text
symbol       PWRC
network      mainnet-beta
decimals     9
standard     Token-2022
mint         PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc
```

`POWERCHAIN_MINT`, `PWRC_MINT`, `POWERCHAIN_CREDIT_TOKEN`, and `PWRC_CREDIT_NETWORK` may confirm this identity but cannot override it.

PowerChain-specific program IDs remain optional and blank until a real deployment address is supplied. Configured addresses must decode to 32-byte Solana public keys.

## Sui runtime

```dotenv
SUI_NETWORK=devnet
SUI_RPC_URL=
SUI_NETWORK_DEVNET=https://fullnode.devnet.sui.io:443
SUI_NETWORK_TESTNET=https://fullnode.testnet.sui.io:443
SUI_NETWORK_MAINNET=https://fullnode.mainnet.sui.io:443
```

An explicit `SUI_RPC_URL` overrides the selected profile.

## Persistence roles

- **PostgreSQL / Prisma** — authoritative user/session/settings/audit state. PWRC accounting continues to use transactional PostgreSQL with row locking and integer base units.
- **MongoDB** — optional auxiliary/document integration only; never authoritative for PWRC accounting.
- **Redis** — optional distributed rate-limit/cache infrastructure.

Prisma ORM v7 uses `prisma.config.ts`. `DATABASE_URL` is the runtime connection. If `DIRECT_URL` is configured, Prisma CLI/migration commands use it because Prisma v7 removed `datasource.directUrl` from `schema.prisma`.

## Authentication and protected settings

`AUTH_TOKEN_MODE=opaque` remains the default. `AUTH_TOKEN_MODE=jwt` uses HS256 and requires a minimum 32-byte `JWT_SECRET`. JWT bearer tokens still resolve a PostgreSQL session by `sid` and user by `sub`, preserving revocation/expiry semantics.

`SETTINGS_ENCRYPTION_KEY` is consumed by the AES-256-GCM protected settings service; plaintext protected values are not persisted.

## Rate limiting

Global, authentication, and AI budgets are distinct. Authorization credentials are SHA-256 fingerprinted before entering rate-limit keys.

```dotenv
GLOBAL_RATE_LIMIT=300
GLOBAL_RATE_WINDOW_MS=60000
AUTH_RATE_LIMIT=20
AI_RATE_LIMIT=30
AI_RATE_WINDOW_MS=60000
RATE_LIMIT_STORE=memory
```

For multi-instance production use `RATE_LIMIT_STORE=redis` with `REDIS_URL`.

## MCP controls

Production MCP servers require both:

1. explicit non-empty `allowedTools`, and
2. explicit hostname presence in `MCP_ALLOWED_HOSTS`.

External `readOnlyHint=true` is independently required at execution time. Tool schemas/descriptions/results are bounded before model context use. Credential-shaped argument fields are blocked. DNS/IP checks reject private/reserved targets. Raw MCP result bodies are not persisted to the durable audit record; only the result hash is retained.

## Sanitized system API

```text
GET /api/v1/system/solana
GET /api/v1/capilot-mobile/system/solana
GET /api/v1/copilot-mobile/system/solana
```

The response contains the selected cluster/provider classification, commitment, whether Helius is configured, PWRC identity, optional PowerChain program IDs, and standard Solana/Metaplex program IDs. It never returns provider keys, RPC URLs, database URLs, JWT/encryption secrets, or AI keys.

## Compatibility API prefixes

The Fastify adapter canonicalizes these prefixes to the same handlers:

```text
/api/v1/*
/api/v1/capilot-mobile/*
/api/v1/copilot-mobile/*
```
