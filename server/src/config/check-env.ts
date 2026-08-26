import { env } from "./env.js";
import { aiProviderStatus } from "../integrations/ai-providers.js";

const safe = {
  APP_NAME: env.APP_NAME,
  APP_VERSION: env.APP_VERSION,
  NODE_ENV: env.NODE_ENV,
  APP_ENV: env.APP_ENV,
  LOG_LEVEL: env.LOG_LEVEL,
  PORT: env.PORT,
  HOST: env.HOST,
  CORS_ORIGINS: env.CORS_ORIGINS,
  POSTGRESQL: env.DATABASE_URL ? "configured" : "missing",
  PRISMA_DIRECT: env.DIRECT_URL ? "configured" : "not configured",
  SUPABASE: env.SUPABASE_URL ? "configured" : "not configured",
  MONGODB: env.MONGO_URL ? "configured" : "not configured",
  REDIS: env.REDIS_URL ? "configured" : "not configured",
  RATE_LIMIT_STORE: env.RATE_LIMIT_STORE,
  AUTH_TOKEN_MODE: env.AUTH_TOKEN_MODE,
  JWT_SECRET: env.JWT_SECRET ? "configured" : "not configured",
  SETTINGS_ENCRYPTION_KEY: env.SETTINGS_ENCRYPTION_KEY ? "configured" : "not configured",
  AI_MODE: env.AI_MODE,
  AI_PRIMARY_PROVIDER: env.AI_PRIMARY_PROVIDER,
  AI_PROVIDER_ORDER: env.AI_PROVIDER_ORDER_PARSED.join(","),
  AI_PROVIDERS: aiProviderStatus().filter((p) => p.configured).map((p) => p.id).join(",") || "none",
  SOLANA_NETWORK: env.SOLANA_NETWORK,
  SOLANA_RPC_PROVIDER: env.SOLANA_RPC_PROVIDER_EFFECTIVE,
  HELIUS: env.HELIUS_RPC_URL || env.HELIUS_API_KEY ? "configured" : "not configured",
  POWERCHAIN_PROGRAM_ID: env.POWERCHAIN_PROGRAM_ID ? "configured" : "not configured",
  POWERCHAIN_ENERGY_RWA_PROGRAM_ID: env.POWERCHAIN_ENERGY_RWA_PROGRAM_ID ? "configured" : "not configured",
  SUI_NETWORK: env.SUI_NETWORK,
  PWRC_CREDIT_NETWORK: env.PWRC_CREDIT_NETWORK,
  PWRC_MINT: env.POWERCHAIN_MINT ?? "not configured for selected network",
  PWRC_TOPUPS_ENABLED: env.PWRC_TOPUPS_ENABLED,
  MCP_ENABLED: env.MCP_ENABLED,
};

console.log("PowerChain API environment");
console.table(safe);
