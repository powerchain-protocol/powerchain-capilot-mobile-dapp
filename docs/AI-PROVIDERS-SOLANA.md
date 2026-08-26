# PowerChain Copilot 1.0.0 — Managed AI, Solana and Infrastructure Configuration

## Runtime contract

The public Expo client contains only `EXPO_PUBLIC_*` values. Provider keys,
database credentials, Helius keys, JWT signing secrets, settings-encryption
keys and Payment Kernel secrets remain server-only.

Development defaults:

```text
Expo API       http://127.0.0.1:8000/api/v1
Network        devnet
Data mode      demo
AI mode        managed
PWRC credits   canonical mainnet-beta PWRC identity
```

The `/api/v1/capilot-mobile/*` compatibility namespace and the corrected
`/api/v1/copilot-mobile/*` alias remain available.

## Managed AI provider routing

PowerChain supports five provider identities behind one Copilot contract:

```text
openai
anthropic
deepseek
llama
emergent
```

Configuration:

```env
AI_PRIMARY_PROVIDER=openai
AI_PROVIDER_ORDER=openai,anthropic,deepseek,llama,emergent
AI_FALLBACK_ENABLED=true
AI_PROVIDER_TIMEOUT_MS=60000
AI_MAX_OUTPUT_TOKENS=4096
```

The provider router preserves one billing rule:

```text
0..N provider attempts / read-only MCP calls
          ↓
1 verified + delivery-acknowledged Copilot response
          ↓
1 MSG UNIT = 10,000 PWRC
```

Provider fallback does not create additional PWRC message charges.

### OpenAI

OpenAI uses the Responses API and the existing structured MCP loop.

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-5.6-terra
```

### Anthropic

Anthropic uses the Messages API and converts PowerChain MCP descriptors into
Anthropic structured tools. Tool results are returned as untrusted data blocks.

```env
ANTHROPIC_API_KEY=
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODEL=
ANTHROPIC_VERSION=2023-06-01
```

`ANTHROPIC_MODEL` is deliberately not invented by the repository. Set an
approved model explicitly for the deployment.

### DeepSeek

DeepSeek uses its OpenAI-compatible Chat Completions interface.

```env
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

### Llama-compatible endpoint

This adapter is intended for a controlled OpenAI-compatible Llama endpoint such
as Ollama, vLLM or another approved inference gateway.

```env
LLAMA_API_KEY=local
LLAMA_BASE_URL=http://127.0.0.1:11434/v1
LLAMA_MODEL=
```

Production configuration rejects localhost Llama endpoints.

### Emergent managed endpoint

Emergent is represented as an explicit OpenAI-compatible managed endpoint:

```env
EMERGENT_LLM_KEY=
EMERGENT_LLM_BASE_URL=
EMERGENT_LLM_MODEL=
```

No client-side Expo variable receives this key.

## Databases

PostgreSQL/Prisma remains the authoritative transactional database.

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/powerchain_copilot
DIRECT_URL=
```

Optional MongoDB is an auxiliary/document integration boundary, not the source
of financial truth:

```env
MONGO_URL=
MONGO_DB_NAME=powerchain_copilot
```

Redis can provide a shared rate-limit store for multi-instance deployments:

```env
REDIS_URL=
RATE_LIMIT_STORE=redis
```

If Redis is unavailable/not configured, development may use the process-local
`memory` store. Production multi-instance deployments should use Redis or an
external API gateway with equivalent distributed limits.

## Authentication and encrypted settings

The existing revocable database session remains authoritative. Token
presentation can be opaque or signed JWT:

```env
AUTH_TOKEN_MODE=opaque
JWT_SECRET=
```

JWT mode signs the bearer token but still checks its database session record,
so logout/revocation is preserved.

Sensitive server-side settings can use the AES-256-GCM helper backed by:

```env
SETTINGS_ENCRYPTION_KEY=
```

## Rate limits

```env
GLOBAL_RATE_LIMIT=300
GLOBAL_RATE_WINDOW_MS=60000
AUTH_RATE_LIMIT=20
AI_RATE_LIMIT=30
AI_RATE_WINDOW_MS=60000
```

The global limiter excludes liveness/readiness endpoints. Authentication and AI
retain narrower limits. Authorization bearer tokens are hashed before being
used as rate-limit identities.

## Solana network profiles

```env
SOLANA_NETWORK=devnet
SOLANA_RPC_PROVIDER=auto
SOLANA_RPC_URL=
SOLANA_RPC_DEVNET_URL=https://api.devnet.solana.com
SOLANA_RPC_MAINNET_URL=https://api.mainnet-beta.solana.com
HELIUS_RPC_URL=
HELIUS_API_KEY=
```

Provider resolution is:

```text
explicit provider=public → selected public cluster URL
provider=helius          → HELIUS_RPC_URL or key-derived Helius RPC
provider=custom          → SOLANA_RPC_URL
auto                     → Helius → custom → public
```

The public `/api/v1/system/solana` endpoint never returns RPC URLs or Helius
keys. It reports only the selected cluster/provider and public program/token
identities.

## PowerChain program IDs

PowerChain program IDs are intentionally unset until deployed addresses are
verified:

```env
POWERCHAIN_PROGRAM_ID=
POWERCHAIN_ENERGY_RWA_PROGRAM_ID=
```

When configured they must decode to 32-byte Solana public keys.

## Standard Solana programs

The repository includes verified public program identities for System, SPL
Token, Token-2022, Associated Token, Memo and Compute Budget programs.

PWRC remains:

```text
Network       mainnet-beta
Program       Token-2022
Mint          PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc
Decimals      9
Credit token  PWRC
```

Operational `SOLANA_NETWORK=devnet` does not change the canonical PWRC credit
identity. Development top-ups should remain disabled unless a verified devnet
credit asset/payment policy is explicitly configured.

## Metaplex

Configured public programs include:

```text
Token Metadata
MPL Core
Bubblegum
Candy Machine
Candy Guard
Token Authorization Rules
```

These addresses are runtime-observable through `/api/v1/system/solana` and are
validated as Solana program addresses during environment parsing.

## Sui

```env
SUI_NETWORK=devnet
SUI_RPC_URL=
SUI_NETWORK_DEVNET=https://fullnode.devnet.sui.io:443
SUI_NETWORK_TESTNET=https://fullnode.testnet.sui.io:443
SUI_NETWORK_MAINNET=https://fullnode.mainnet.sui.io:443
```

`SUI_RPC_URL`, when explicitly set, overrides the network-specific endpoint.

## Public runtime diagnostics

```text
GET /api/v1/config
GET /api/v1/system/solana
GET /api/v1/integrations/health
```

These routes expose only sanitized state. Secret URLs and provider credentials
must never be returned.
