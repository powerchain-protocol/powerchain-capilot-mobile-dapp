import "dotenv/config";
import bs58 from "bs58";
import { z } from "zod";
import {
  PWRC_MINT as CANONICAL_PWRC_MINT,
  PWRC_TOKEN_2022_PROGRAM as CANONICAL_TOKEN_2022_PROGRAM,
} from "@powerchain/pwrc-credits";

// Canonical environment aliases. Older deployments remain supported, but the
// documented names are APP_ENV/API_HOST/API_PORT/CORS_ORIGINS.
if (!process.env.POWERCHAIN_ENV && process.env.APP_ENV) process.env.POWERCHAIN_ENV = process.env.APP_ENV;
if (!process.env.HOST && process.env.API_HOST) process.env.HOST = process.env.API_HOST;
if (!process.env.PORT && process.env.API_PORT) process.env.PORT = process.env.API_PORT;
if (!process.env.CORS_ORIGIN && process.env.CORS_ORIGINS) process.env.CORS_ORIGIN = process.env.CORS_ORIGINS;

const bool = z.enum(["true", "false"]).transform((v) => v === "true");
const opt = z.string().trim().optional();
const optUrl = z.union([z.string().url(), z.literal("")]).optional();

function nonEmpty(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function validBase58(value: string, bytes = 32) {
  try {
    return bs58.decode(value).length === bytes;
  } catch {
    return false;
  }
}

function validCorsOrigin(value: string) {
  try {
    const u = new URL(value);
    return (
      ["http:", "https:"].includes(u.protocol) &&
      u.pathname === "/" &&
      !u.search &&
      !u.hash &&
      !u.username &&
      !u.password
    );
  } catch {
    return false;
  }
}

const providerIds = [
  "openai",
  "anthropic",
  "gemini",
  "deepseek",
  "ollama",
  "gridllm",
  "emergent",
] as const;
export type AiProviderId = (typeof providerIds)[number];

function parseProviderOrder(value: string): AiProviderId[] {
  const allowed = new Set<string>(providerIds);
  return [...new Set(value.split(",").map((v) => v.trim().toLowerCase()).filter((v) => allowed.has(v)))] as AiProviderId[];
}

const schema = z.object({
  // Runtime / app
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  POWERCHAIN_ENV: z.enum(["development", "preview", "production", "test"]).default("development"),
  APP_NAME: z.string().trim().min(1).default("PowerChain Copilot"),
  APP_VERSION: z.string().trim().min(1).default("1.0.0"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DEBUG: bool.default("false"),

  // API
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  API_PREFIX: z.string().trim().min(1).default("/api/v1"),
  API_BASE_URL: optUrl,
  INTERNAL_API_URL: optUrl,
  INTERNAL_API_SECRET: opt,
  INTERNAL_HMAC_SECRET: opt,
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"),
  CORS_ALLOW_LOCALHOST: bool.default("true"),
  CORS_CREDENTIALS: bool.default("false"),
  CORS_MAX_AGE_SECONDS: z.coerce.number().int().min(0).max(86400).default(86400),
  TRUST_PROXY: bool.default("false"),
  BODY_LIMIT_BYTES: z.coerce.number().int().min(64 * 1024).max(20 * 1024 * 1024).default(1024 * 1024),

  // Auth / security
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  AUTH_TOKEN_MODE: z.enum(["opaque", "jwt"]).default("opaque"),
  JWT_SECRET: opt,
  JWT_EXPIRES_IN: z.string().trim().min(1).default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().trim().min(1).default("30d"),
  SETTINGS_ENCRYPTION_KEY: opt,

  // PostgreSQL / Prisma
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: opt,
  POSTGRES_HOST: opt,
  POSTGRES_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  POSTGRES_DB: opt,
  POSTGRES_USER: opt,
  POSTGRES_PASSWORD: opt,
  POSTGRES_SSL: bool.default("false"),
  PRISMA_LOG_LEVEL: z.enum(["query", "info", "warn", "error"]).default("warn"),
  PRISMA_ACCELERATE_URL: optUrl,

  // Supabase (SDK and optional hosted Postgres)
  SUPABASE_URL: optUrl,
  SUPABASE_PUBLISHABLE_KEY: opt,
  SUPABASE_ANON_KEY: opt,
  SUPABASE_SERVICE_ROLE_KEY: opt,
  SUPABASE_DATABASE_URL: opt,
  SUPABASE_DIRECT_URL: opt,
  SUPABASE_PROJECT_REF: opt,
  SUPABASE_DB_HOST: opt,
  SUPABASE_DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  SUPABASE_DB_NAME: opt,
  SUPABASE_DB_USER: opt,
  SUPABASE_JWT_SECRET: opt,

  // Mongo / Redis
  MONGO_URL: opt,
  MONGO_DB_NAME: z.string().trim().min(1).default("powerchain_copilot"),
  MONGO_MAX_POOL_SIZE: z.coerce.number().int().min(1).max(500).default(20),
  MONGO_MIN_POOL_SIZE: z.coerce.number().int().min(0).max(100).default(2),
  REDIS_URL: opt,
  REDIS_PREFIX: z.string().trim().min(1).default("powerchain:"),
  CACHE_ENABLED: bool.default("true"),
  CACHE_DEFAULT_TTL_SECONDS: z.coerce.number().int().min(1).max(86400).default(60),
  RATE_LIMIT_STORE: z.enum(["memory", "redis"]).default("memory"),

  // Rate limiting
  RATE_LIMIT_ENABLED: bool.default("true"),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100000).optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).max(3600000).optional(),
  GLOBAL_RATE_LIMIT: z.coerce.number().int().min(10).max(100000).default(300),
  GLOBAL_RATE_WINDOW_MS: z.coerce.number().int().min(1000).max(3600000).default(60000),
  AUTH_RATE_LIMIT: z.coerce.number().int().min(1).max(1000).default(20),
  AI_RATE_LIMIT: z.coerce.number().int().min(1).max(1000).default(30),
  AI_RATE_WINDOW_MS: z.coerce.number().int().min(1000).max(3600000).default(60000),

  // Managed AI routing
  AI_MODE: z.enum(["managed", "disabled"]).default("managed"),
  AI_PRIMARY_PROVIDER: z.enum(providerIds).default("openai"),
  AI_PROVIDER_ORDER: z.string().default("openai,anthropic,gemini,deepseek,ollama,gridllm,emergent"),
  AI_FALLBACK_ENABLED: bool.default("true"),
  AI_PROVIDER_TIMEOUT_MS: z.coerce.number().int().min(1000).max(180000).default(60000),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(64).max(131072).default(4096),
  AI_REASONING_EFFORT: z.enum(["none", "low", "medium", "high", "xhigh", "max"]).default("medium"),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(2),

  OPENAI_API_KEY: opt,
  OPENAI_BASE_URL: optUrl,
  OPENAI_MODEL: z.string().trim().min(1).default("gpt-5.6-terra"),

  ANTHROPIC_API_KEY: opt,
  ANTHROPIC_BASE_URL: z.string().url().default("https://api.anthropic.com"),
  ANTHROPIC_MODEL: opt,
  ANTHROPIC_VERSION: z.string().trim().min(1).default("2023-06-01"),

  GEMINI_API_KEY: opt,
  GEMINI_BASE_URL: z.string().url().default("https://generativelanguage.googleapis.com/v1beta/openai/"),
  GEMINI_MODEL: opt,

  DEEPSEEK_API_KEY: opt,
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().trim().min(1).default("deepseek-v4-flash"),

  OLLAMA_BASE_URL: z.string().url().default("http://127.0.0.1:11434/v1"),
  OLLAMA_MODEL: opt,
  OLLAMA_API_KEY: opt,
  // Legacy aliases
  LLAMA_BASE_URL: optUrl,
  LLAMA_MODEL: opt,
  LLAMA_API_KEY: opt,

  GRIDLLM_ENABLED: bool.default("true"),
  GRIDLLM_BASE_URL: optUrl,
  GRIDLLM_API_KEY: opt,
  GRIDLLM_MODEL: opt,

  EMERGENT_LLM_KEY: opt,
  EMERGENT_LLM_BASE_URL: optUrl,
  EMERGENT_LLM_MODEL: opt,

  // Solana selection
  SOLANA_NETWORK: z.enum(["devnet", "mainnet-beta"]).default("devnet"),
  SOLANA_CLUSTER: z.enum(["devnet", "mainnet-beta"]).default("devnet"),
  SOLANA_RPC_PROVIDER: z.enum(["auto", "public", "helius", "custom"]).default("auto"),
  SOLANA_RPC_URL: optUrl,
  SOLANA_RPC_DEVNET_URL: z.string().url().default("https://api.devnet.solana.com"),
  SOLANA_RPC_MAINNET_URL: z.string().url().default("https://api.mainnet-beta.solana.com"),
  SOLANA_WS_DEVNET_URL: z.string().url().default("wss://api.devnet.solana.com"),
  SOLANA_WS_MAINNET_URL: z.string().url().default("wss://api.mainnet-beta.solana.com"),
  SOLANA_COMMITMENT: z.enum(["processed", "confirmed", "finalized"]).default("confirmed"),
  HELIUS_API_KEY: opt,
  HELIUS_RPC_URL: optUrl,
  HELIUS_WS_URL: optUrl,
  HELIUS_DAS_ENABLED: bool.default("true"),
  HELIUS_WEBHOOK_SECRET: opt,

  // Canonical public Solana programs
  SYSTEM_PROGRAM_ID: z.string().default("11111111111111111111111111111111"),
  SPL_TOKEN_PROGRAM_ID: z.string().default("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  TOKEN_2022_PROGRAM: z.string().default(CANONICAL_TOKEN_2022_PROGRAM),
  ASSOCIATED_TOKEN_PROGRAM_ID: z.string().default("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
  COMPUTE_BUDGET_PROGRAM_ID: z.string().default("ComputeBudget111111111111111111111111111111"),
  MEMO_PROGRAM_ID: z.string().default("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),

  // PowerChain programs - intentionally blank until verified deployments exist
  POWERCHAIN_PROGRAM_ID: opt,
  POWERCHAIN_ENERGY_RWA_PROGRAM_ID: opt,
  POWERCHAIN_MARKET_PROGRAM_ID: opt,
  POWERCHAIN_SETTLEMENT_PROGRAM_ID: opt,
  POWERCHAIN_REWARDS_PROGRAM_ID: opt,
  POWERCHAIN_TREASURY_PROGRAM_ID: opt,
  POWERCHAIN_ACP_PROGRAM_ID: opt,
  POWERCHAIN_PROGRAM_AUTHORITY: opt,
  POWERCHAIN_TREASURY_ADDRESS: opt,

  // Metaplex and compression programs
  METAPLEX_TOKEN_METADATA_PROGRAM_ID: z.string().default("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
  METAPLEX_CORE_PROGRAM_ID: z.string().default("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"),
  METAPLEX_BUBBLEGUM_PROGRAM_ID: z.string().default("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY"),
  METAPLEX_CANDY_MACHINE_PROGRAM_ID: z.string().default("CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR"),
  METAPLEX_CANDY_GUARD_PROGRAM_ID: z.string().default("Guard1JwRhJkVH6XZhzoYxeBVQe872VH6QggF4BWmS9g"),
  METAPLEX_TOKEN_AUTH_RULES_PROGRAM_ID: z.string().default("auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg"),
  SOLANA_ACCOUNT_COMPRESSION_PROGRAM_ID: z.string().default("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK"),
  SOLANA_NOOP_PROGRAM_ID: z.string().default("noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV"),

  // PWRC environment-aware identity
  POWERCHAIN_CREDIT_TOKEN: z.enum(["PWRC"]).default("PWRC"),
  PWRC_SYMBOL: z.enum(["PWRC"]).default("PWRC"),
  PWRC_DECIMALS: z.coerce.number().int().min(0).max(18).default(9),
  PWRC_MINT_MAINNET: z.string().min(32).max(64).default(CANONICAL_PWRC_MINT),
  PWRC_MINT_DEVNET: opt,
  POWERCHAIN_MINT: opt,
  PWRC_MINT: opt, // legacy alias
  PWRC_TOKEN_PROGRAM_ID: z.string().default(CANONICAL_TOKEN_2022_PROGRAM),
  COPILOT_MESSAGE_PRICE_PWRC: z.coerce.number().int().positive().default(10000),
  COPILOT_MESSAGE_PRICE_BASE_UNITS: z.string().regex(/^\d+$/).default("10000000000000"),

  PWRC_CREDITS_ENABLED: bool.default("true"),
  PWRC_CREDIT_NETWORK: z.enum(["devnet", "mainnet-beta"]).optional(),
  PWRC_CREDIT_RESERVATION_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(600),
  PWRC_CREDIT_ACK_TTL_SECONDS: z.coerce.number().int().min(15).max(600).default(120),
  PWRC_CREDIT_REAPER_ENABLED: bool.default("true"),
  PWRC_CREDIT_REAPER_INTERVAL_SECONDS: z.coerce.number().int().min(10).max(3600).default(60),
  PWRC_LOW_CREDIT_RESPONSES: z.coerce.number().int().min(1).max(1000).default(10),
  PWRC_DEMO_GRANT_ENABLED: bool.default("true"),
  PWRC_TOPUPS_ENABLED: bool.default("false"),
  PWRC_TOPUP_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
  PWRC_TREASURY_ADDRESS: opt,
  PAYMENT_KERNEL_WEBHOOK_SECRET: opt,
  PAYMENT_KERNEL_WEBHOOK_MAX_SKEW_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),

  // Stablecoins by network
  USDC_MINT_MAINNET: opt,
  USDC_MINT_DEVNET: opt,
  EURC_MINT_MAINNET: opt,
  EURC_MINT_DEVNET: opt,
  USDC_MINT: opt, // legacy alias
  EURC_MINT: opt,

  // Solana Pay
  SOLANA_PAY_ENABLED: bool.default("true"),
  SOLANA_PAY_RECIPIENT: opt,
  SOLANA_PAY_REFERENCE_PREFIX: z.string().trim().min(1).default("powerchain"),
  SOLANA_PAY_DEFAULT_TOKEN: z.string().trim().min(1).default("USDC"),

  // Sui
  SUI_NETWORK: z.enum(["devnet", "testnet", "mainnet"]).default("devnet"),
  SUI_RPC_URL: optUrl,
  SUI_NETWORK_DEVNET: z.string().url().default("https://fullnode.devnet.sui.io:443"),
  SUI_NETWORK_TESTNET: z.string().url().default("https://fullnode.testnet.sui.io:443"),
  SUI_NETWORK_MAINNET: z.string().url().default("https://fullnode.mainnet.sui.io:443"),
  POWERCHAIN_SUI_PACKAGE_ID: opt,
  POWERCHAIN_SUI_REGISTRY_OBJECT_ID: opt,
  POWERCHAIN_SUI_TREASURY_OBJECT_ID: opt,
  WPWRC_SUI_COIN_TYPE: opt,

  // Market data / liquidity
  PYTH_API_KEY: opt,
  PYTH_HERMES_URL: z.string().url().default("https://hermes.pyth.network"),
  PYTH_ENABLED: bool.default("true"),
  BIRDEYE_API_KEY: opt,
  BIRDEYE_BASE_URL: z.string().url().default("https://public-api.birdeye.so"),
  BIRDEYE_CHAIN: z.string().trim().min(1).default("solana"),
  COINGECKO_API_KEY: opt,
  COINGECKO_API_BASE_URL: z.string().url().default("https://api.coingecko.com/api/v3"),
  COINGECKO_API_PLAN: z.enum(["demo", "pro"]).default("demo"),
  COINGECKO_ENABLED: bool.default("true"),
  COINMARKETCAP_API_KEY: opt,
  COINMARKETCAP_API_BASE_URL: z.string().url().default("https://pro-api.coinmarketcap.com/v1"),
  COINMARKETCAP_ENABLED: bool.default("true"),
  JUPITER_API_KEY: opt,
  JUPITER_API_URL: z.string().url().default("https://api.jup.ag"),
  JUPITER_ENABLED: bool.default("true"),
  MARKET_CACHE_FRESH_MS: z.coerce.number().int().min(1000).max(3600000).default(30000),
  MARKET_CACHE_STALE_MS: z.coerce.number().int().min(1000).max(86400000).default(300000),

  // MCP
  MCP_ENABLED: bool.default("false"),
  MCP_POLICY_MODE: z.enum(["allowlist"]).default("allowlist"),
  MCP_EXTERNAL_TOOLS_READ_ONLY: bool.default("true"),
  MCP_TYPESCRIPT_URL: optUrl,
  MCP_EXPRESS_GATEWAY_URL: optUrl,
  MCP_PYTHON_GATEWAY_URL: optUrl,
  MCP_INTERNAL_SECRET: opt,
  MCP_SERVERS_JSON: z.string().default("[]"),
  MCP_ALLOWED_HOSTS: z.string().default(""),
  MCP_MAX_SERVERS: z.coerce.number().int().min(0).max(16).default(8),
  MCP_MAX_TOOLS: z.coerce.number().int().min(0).max(64).default(24),
  MCP_MAX_TOOL_CALLS: z.coerce.number().int().min(0).max(12).default(4),
  MCP_MAX_ARGUMENT_BYTES: z.coerce.number().int().min(256).max(65536).default(8192),
  MCP_MAX_TOOL_SCHEMA_BYTES: z.coerce.number().int().min(1024).max(262144).default(65536),
  MCP_MAX_RESULT_CHARS: z.coerce.number().int().min(256).max(100000).default(12000),
  MCP_TOOL_TIMEOUT_MS: z.coerce.number().int().min(500).max(120000).default(15000),
  MCP_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(500).max(120000).default(15000),

  // Observability
  OTEL_ENABLED: bool.default("false"),
  OTEL_SERVICE_NAME: z.string().trim().min(1).default("powerchain-copilot"),
  OTEL_EXPORTER_OTLP_ENDPOINT: optUrl,
  SENTRY_DSN: optUrl,
  METRICS_ENABLED: bool.default("true"),
  HEALTHCHECK_ENABLED: bool.default("true"),

  // Feature flags
  FEATURE_SOLANA: bool.default("true"),
  FEATURE_SUI: bool.default("true"),
  FEATURE_PWRC: bool.default("true"),
  FEATURE_METAPLEX: bool.default("true"),
  FEATURE_SOLANA_PAY: bool.default("true"),
  FEATURE_COPILOT: bool.default("true"),
  FEATURE_MCP: bool.default("true"),
  FEATURE_COINGECKO: bool.default("true"),
  FEATURE_COINMARKETCAP: bool.default("true"),
  FEATURE_BIRDEYE: bool.default("true"),
  FEATURE_PYTH: bool.default("true"),
  FEATURE_JUPITER: bool.default("true"),
}).superRefine((v, ctx) => {
  if (v.MARKET_CACHE_STALE_MS < v.MARKET_CACHE_FRESH_MS) {
    ctx.addIssue({ code: "custom", path: ["MARKET_CACHE_STALE_MS"], message: "MARKET_CACHE_STALE_MS must be >= MARKET_CACHE_FRESH_MS." });
  }

  if (v.CORS_ORIGIN !== "*") {
    const origins = v.CORS_ORIGIN.split(",").map((x) => x.trim()).filter(Boolean);
    if (!origins.length || origins.some((origin) => !validCorsOrigin(origin))) {
      ctx.addIssue({ code: "custom", path: ["CORS_ORIGIN"], message: "CORS origins must be comma-separated http(s) origins without paths, queries, credentials, or fragments." });
    }
  }
  if (v.NODE_ENV === "production" && (v.CORS_ORIGIN === "*" || v.CORS_ALLOW_LOCALHOST || /localhost|127\.0\.0\.1|\[::1\]/i.test(v.CORS_ORIGIN))) {
    ctx.addIssue({ code: "custom", path: ["CORS_ORIGIN"], message: "Production CORS must be explicit and may not include localhost." });
  }

  if (v.RATE_LIMIT_STORE === "redis" && !nonEmpty(v.REDIS_URL)) {
    ctx.addIssue({ code: "custom", path: ["REDIS_URL"], message: "RATE_LIMIT_STORE=redis requires REDIS_URL." });
  }
  if (v.AUTH_TOKEN_MODE === "jwt" && (v.JWT_SECRET?.length ?? 0) < 32) {
    ctx.addIssue({ code: "custom", path: ["JWT_SECRET"], message: "JWT mode requires JWT_SECRET of at least 32 characters." });
  }
  if (v.SETTINGS_ENCRYPTION_KEY && v.SETTINGS_ENCRYPTION_KEY.length < 32) {
    ctx.addIssue({ code: "custom", path: ["SETTINGS_ENCRYPTION_KEY"], message: "SETTINGS_ENCRYPTION_KEY must be at least 32 characters." });
  }

  const order = parseProviderOrder(v.AI_PROVIDER_ORDER);
  if (!order.includes(v.AI_PRIMARY_PROVIDER)) {
    ctx.addIssue({ code: "custom", path: ["AI_PROVIDER_ORDER"], message: "AI_PROVIDER_ORDER must include AI_PRIMARY_PROVIDER." });
  }
  if (v.AI_PRIMARY_PROVIDER === "anthropic" && (!v.ANTHROPIC_API_KEY || !v.ANTHROPIC_MODEL)) {
    ctx.addIssue({ code: "custom", path: ["ANTHROPIC_MODEL"], message: "Anthropic primary provider requires key and model." });
  }
  if (v.AI_PRIMARY_PROVIDER === "gemini" && (!v.GEMINI_API_KEY || !v.GEMINI_MODEL)) {
    ctx.addIssue({ code: "custom", path: ["GEMINI_MODEL"], message: "Gemini primary provider requires key and model." });
  }
  if (v.AI_PRIMARY_PROVIDER === "deepseek" && !v.DEEPSEEK_API_KEY) {
    ctx.addIssue({ code: "custom", path: ["DEEPSEEK_API_KEY"], message: "DeepSeek primary provider requires DEEPSEEK_API_KEY." });
  }
  if (v.AI_PRIMARY_PROVIDER === "ollama" && !v.OLLAMA_MODEL) {
    ctx.addIssue({ code: "custom", path: ["OLLAMA_MODEL"], message: "Ollama primary provider requires OLLAMA_MODEL." });
  }
  if (v.AI_PRIMARY_PROVIDER === "gridllm" && (!v.GRIDLLM_ENABLED || !v.GRIDLLM_BASE_URL || !v.GRIDLLM_MODEL)) {
    ctx.addIssue({ code: "custom", path: ["GRIDLLM_BASE_URL"], message: "GRIDLLM primary provider requires enabled, base URL and model." });
  }
  if (v.AI_PRIMARY_PROVIDER === "emergent" && (!v.EMERGENT_LLM_KEY || !v.EMERGENT_LLM_BASE_URL || !v.EMERGENT_LLM_MODEL)) {
    ctx.addIssue({ code: "custom", path: ["EMERGENT_LLM_KEY"], message: "Emergent primary provider requires key, base URL and model." });
  }
  if (v.NODE_ENV === "production" && /localhost|127\.0\.0\.1/i.test(v.OLLAMA_BASE_URL)) {
    ctx.addIssue({ code: "custom", path: ["OLLAMA_BASE_URL"], message: "Production OLLAMA_BASE_URL may not point to localhost." });
  }

  if (v.SOLANA_RPC_PROVIDER === "helius" && !v.HELIUS_RPC_URL && !v.HELIUS_API_KEY) {
    ctx.addIssue({ code: "custom", path: ["HELIUS_RPC_URL"], message: "Helius provider requires HELIUS_RPC_URL or HELIUS_API_KEY." });
  }
  if (v.SOLANA_RPC_PROVIDER === "custom" && !v.SOLANA_RPC_URL) {
    ctx.addIssue({ code: "custom", path: ["SOLANA_RPC_URL"], message: "Custom Solana RPC provider requires SOLANA_RPC_URL." });
  }

  const optionalSolanaKeys = [
    ["POWERCHAIN_PROGRAM_ID", v.POWERCHAIN_PROGRAM_ID],
    ["POWERCHAIN_ENERGY_RWA_PROGRAM_ID", v.POWERCHAIN_ENERGY_RWA_PROGRAM_ID],
    ["POWERCHAIN_MARKET_PROGRAM_ID", v.POWERCHAIN_MARKET_PROGRAM_ID],
    ["POWERCHAIN_SETTLEMENT_PROGRAM_ID", v.POWERCHAIN_SETTLEMENT_PROGRAM_ID],
    ["POWERCHAIN_REWARDS_PROGRAM_ID", v.POWERCHAIN_REWARDS_PROGRAM_ID],
    ["POWERCHAIN_TREASURY_PROGRAM_ID", v.POWERCHAIN_TREASURY_PROGRAM_ID],
    ["POWERCHAIN_ACP_PROGRAM_ID", v.POWERCHAIN_ACP_PROGRAM_ID],
    ["POWERCHAIN_PROGRAM_AUTHORITY", v.POWERCHAIN_PROGRAM_AUTHORITY],
    ["POWERCHAIN_TREASURY_ADDRESS", v.POWERCHAIN_TREASURY_ADDRESS],
    ["PWRC_MINT_DEVNET", v.PWRC_MINT_DEVNET],
    ["PWRC_TREASURY_ADDRESS", v.PWRC_TREASURY_ADDRESS],
    ["SOLANA_PAY_RECIPIENT", v.SOLANA_PAY_RECIPIENT],
  ] as const;
  for (const [key, value] of optionalSolanaKeys) {
    if (value && !validBase58(value)) ctx.addIssue({ code: "custom", path: [key], message: `${key} must be a valid 32-byte Solana public key.` });
  }

  const canonicalPrograms = [
    ["SYSTEM_PROGRAM_ID", v.SYSTEM_PROGRAM_ID],
    ["SPL_TOKEN_PROGRAM_ID", v.SPL_TOKEN_PROGRAM_ID],
    ["TOKEN_2022_PROGRAM", v.TOKEN_2022_PROGRAM],
    ["ASSOCIATED_TOKEN_PROGRAM_ID", v.ASSOCIATED_TOKEN_PROGRAM_ID],
    ["COMPUTE_BUDGET_PROGRAM_ID", v.COMPUTE_BUDGET_PROGRAM_ID],
    ["MEMO_PROGRAM_ID", v.MEMO_PROGRAM_ID],
    ["METAPLEX_TOKEN_METADATA_PROGRAM_ID", v.METAPLEX_TOKEN_METADATA_PROGRAM_ID],
    ["METAPLEX_CORE_PROGRAM_ID", v.METAPLEX_CORE_PROGRAM_ID],
    ["METAPLEX_BUBBLEGUM_PROGRAM_ID", v.METAPLEX_BUBBLEGUM_PROGRAM_ID],
    ["METAPLEX_CANDY_MACHINE_PROGRAM_ID", v.METAPLEX_CANDY_MACHINE_PROGRAM_ID],
    ["METAPLEX_CANDY_GUARD_PROGRAM_ID", v.METAPLEX_CANDY_GUARD_PROGRAM_ID],
    ["METAPLEX_TOKEN_AUTH_RULES_PROGRAM_ID", v.METAPLEX_TOKEN_AUTH_RULES_PROGRAM_ID],
    ["SOLANA_ACCOUNT_COMPRESSION_PROGRAM_ID", v.SOLANA_ACCOUNT_COMPRESSION_PROGRAM_ID],
    ["SOLANA_NOOP_PROGRAM_ID", v.SOLANA_NOOP_PROGRAM_ID],
  ] as const;
  for (const [key, value] of canonicalPrograms) {
    if (!validBase58(value)) ctx.addIssue({ code: "custom", path: [key], message: `${key} must be a valid 32-byte program address.` });
  }

  if (v.PWRC_MINT_MAINNET !== CANONICAL_PWRC_MINT) {
    ctx.addIssue({ code: "custom", path: ["PWRC_MINT_MAINNET"], message: "PWRC_MINT_MAINNET must be the canonical mainnet-beta PWRC mint." });
  }
  if (v.TOKEN_2022_PROGRAM !== CANONICAL_TOKEN_2022_PROGRAM || v.PWRC_TOKEN_PROGRAM_ID !== CANONICAL_TOKEN_2022_PROGRAM) {
    ctx.addIssue({ code: "custom", path: ["PWRC_TOKEN_PROGRAM_ID"], message: "PWRC requires the canonical Token-2022 program." });
  }
  if (v.COPILOT_MESSAGE_PRICE_BASE_UNITS !== "10000000000000" || v.COPILOT_MESSAGE_PRICE_PWRC !== 10000) {
    ctx.addIssue({ code: "custom", path: ["COPILOT_MESSAGE_PRICE_BASE_UNITS"], message: "v1.0.0 pricing requires exactly 10,000 PWRC = 10,000,000,000,000 base units." });
  }
  if (v.NODE_ENV === "production" && v.PWRC_DEMO_GRANT_ENABLED) {
    ctx.addIssue({ code: "custom", path: ["PWRC_DEMO_GRANT_ENABLED"], message: "Production may not enable PWRC demo grants." });
  }
  if (v.PAYMENT_KERNEL_WEBHOOK_SECRET && v.PAYMENT_KERNEL_WEBHOOK_SECRET.length < 32) {
    ctx.addIssue({ code: "custom", path: ["PAYMENT_KERNEL_WEBHOOK_SECRET"], message: "PAYMENT_KERNEL_WEBHOOK_SECRET must be at least 32 characters." });
  }

  if (v.NODE_ENV === "production" && v.MCP_ENABLED) {
    if (!v.MCP_ALLOWED_HOSTS.trim()) ctx.addIssue({ code: "custom", path: ["MCP_ALLOWED_HOSTS"], message: "Production MCP requires an explicit host allowlist." });
    try {
      const servers = JSON.parse(v.MCP_SERVERS_JSON);
      if (!Array.isArray(servers)) throw new Error("not array");
      if (servers.some((server) => !Array.isArray(server?.allowedTools) || server.allowedTools.length === 0)) {
        ctx.addIssue({ code: "custom", path: ["MCP_SERVERS_JSON"], message: "Every production MCP server requires a non-empty allowedTools list." });
      }
    } catch {
      ctx.addIssue({ code: "custom", path: ["MCP_SERVERS_JSON"], message: "MCP_SERVERS_JSON must be a JSON array." });
    }
  }
});

const parsed = schema.parse(process.env);

function resolveSolanaRpc() {
  const publicUrl = parsed.SOLANA_NETWORK === "mainnet-beta" ? parsed.SOLANA_RPC_MAINNET_URL : parsed.SOLANA_RPC_DEVNET_URL;
  if (parsed.SOLANA_RPC_PROVIDER === "public") return { url: publicUrl, provider: "public" as const };
  if (parsed.SOLANA_RPC_PROVIDER === "custom") return { url: nonEmpty(parsed.SOLANA_RPC_URL)!, provider: "custom" as const };
  if (parsed.SOLANA_RPC_PROVIDER === "helius" || (parsed.SOLANA_RPC_PROVIDER === "auto" && (parsed.HELIUS_RPC_URL || parsed.HELIUS_API_KEY))) {
    const url = nonEmpty(parsed.HELIUS_RPC_URL) ?? `https://${parsed.SOLANA_NETWORK === "mainnet-beta" ? "mainnet" : "devnet"}.helius-rpc.com/?api-key=${encodeURIComponent(parsed.HELIUS_API_KEY!)}`;
    return { url, provider: "helius" as const };
  }
  if (parsed.SOLANA_RPC_PROVIDER === "auto" && parsed.SOLANA_RPC_URL) return { url: parsed.SOLANA_RPC_URL, provider: "custom" as const };
  return { url: publicUrl, provider: "public" as const };
}

function resolveSuiRpc() {
  if (parsed.SUI_RPC_URL) return parsed.SUI_RPC_URL;
  if (parsed.SUI_NETWORK === "mainnet") return parsed.SUI_NETWORK_MAINNET;
  if (parsed.SUI_NETWORK === "testnet") return parsed.SUI_NETWORK_TESTNET;
  return parsed.SUI_NETWORK_DEVNET;
}

const creditNetwork = parsed.PWRC_CREDIT_NETWORK ?? parsed.SOLANA_NETWORK;
const selectedPwrcMint = creditNetwork === "mainnet-beta" ? parsed.PWRC_MINT_MAINNET : nonEmpty(parsed.PWRC_MINT_DEVNET);
if (parsed.PWRC_TOPUPS_ENABLED && !selectedPwrcMint) {
  throw new Error("PWRC_TOPUPS_ENABLED requires a verified mint for the selected network; do not substitute the mainnet mint on devnet.");
}
if (parsed.POWERCHAIN_MINT && selectedPwrcMint && parsed.POWERCHAIN_MINT !== selectedPwrcMint) {
  throw new Error("POWERCHAIN_MINT must match the selected network PWRC mint.");
}
if (parsed.PWRC_MINT && selectedPwrcMint && parsed.PWRC_MINT !== selectedPwrcMint) {
  throw new Error("Legacy PWRC_MINT must match the selected network PWRC mint.");
}

const solanaRpc = resolveSolanaRpc();
const ollamaBaseUrl = nonEmpty(parsed.LLAMA_BASE_URL) ?? parsed.OLLAMA_BASE_URL;
const ollamaModel = nonEmpty(parsed.LLAMA_MODEL) ?? parsed.OLLAMA_MODEL;
const ollamaApiKey = nonEmpty(parsed.LLAMA_API_KEY) ?? parsed.OLLAMA_API_KEY;

export const env = {
  ...parsed,
  APP_ENV: parsed.POWERCHAIN_ENV,
  API_HOST: parsed.HOST,
  API_PORT: parsed.PORT,
  CORS_ORIGINS: parsed.CORS_ORIGIN,
  SOLANA_RPC_URL: solanaRpc.url,
  SOLANA_RPC_PROVIDER_EFFECTIVE: solanaRpc.provider,
  SOLANA_WS_URL: parsed.SOLANA_NETWORK === "mainnet-beta" ? parsed.SOLANA_WS_MAINNET_URL : parsed.SOLANA_WS_DEVNET_URL,
  SUI_RPC_URL: resolveSuiRpc(),
  AI_PROVIDER_ORDER_PARSED: parseProviderOrder(parsed.AI_PROVIDER_ORDER),
  OLLAMA_BASE_URL: ollamaBaseUrl,
  OLLAMA_MODEL: ollamaModel,
  OLLAMA_API_KEY: ollamaApiKey,
  PWRC_CREDIT_NETWORK: creditNetwork,
  POWERCHAIN_MINT: selectedPwrcMint ?? null,
  PWRC_MINT: selectedPwrcMint ?? null,
  USDC_MINT: parsed.SOLANA_NETWORK === "mainnet-beta" ? nonEmpty(parsed.USDC_MINT_MAINNET) : nonEmpty(parsed.USDC_MINT_DEVNET),
  EURC_MINT: parsed.SOLANA_NETWORK === "mainnet-beta" ? nonEmpty(parsed.EURC_MINT_MAINNET) : nonEmpty(parsed.EURC_MINT_DEVNET),
  GLOBAL_RATE_LIMIT: parsed.RATE_LIMIT_MAX ?? parsed.GLOBAL_RATE_LIMIT,
  GLOBAL_RATE_WINDOW_MS: parsed.RATE_LIMIT_WINDOW_MS ?? parsed.GLOBAL_RATE_WINDOW_MS,
} as const;
