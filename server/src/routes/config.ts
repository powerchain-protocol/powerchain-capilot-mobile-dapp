import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { mobileApiMetadata } from "../http/api-namespace.js";
import { aiProviderStatus } from "../integrations/ai-providers.js";
import { sanitizedSolanaRuntime } from "../config/solana.js";

export async function registerConfigRoutes(app: FastifyInstance) {
  app.get("/api/v1/config", async () => ({
    release: env.APP_VERSION,
    appName: env.APP_NAME,
    environment: env.NODE_ENV,
    powerchainEnvironment: env.APP_ENV,
    api: {
      ...mobileApiMetadata(),
      corsDiagnostics: "/api/v1/capilot-mobile/cors",
      platformDiagnostics: "/api/v1/system/platform",
      solanaDiagnostics: "/api/v1/system/solana",
    },
    solana: sanitizedSolanaRuntime(),
    sui: { network: env.SUI_NETWORK },
    ai: {
      mode: env.AI_MODE,
      primaryProvider: env.AI_PRIMARY_PROVIDER,
      providerOrder: env.AI_PROVIDER_ORDER_PARSED,
      fallbackEnabled: env.AI_FALLBACK_ENABLED,
      providers: aiProviderStatus(),
    },
    integrations: {
      pyth: { enabled: env.PYTH_ENABLED, configured: Boolean(env.PYTH_API_KEY) },
      birdeye: { enabled: env.FEATURE_BIRDEYE, configured: Boolean(env.BIRDEYE_API_KEY) },
      coingecko: { enabled: env.COINGECKO_ENABLED, configured: Boolean(env.COINGECKO_API_KEY) },
      coinmarketcap: { enabled: env.COINMARKETCAP_ENABLED, configured: Boolean(env.COINMARKETCAP_API_KEY) },
      jupiter: { enabled: env.JUPITER_ENABLED, configured: Boolean(env.JUPITER_API_KEY) },
      helius: { configured: Boolean(env.HELIUS_RPC_URL || env.HELIUS_API_KEY), dasEnabled: env.HELIUS_DAS_ENABLED },
      mcp: { enabled: env.MCP_ENABLED, policyMode: env.MCP_POLICY_MODE, readOnly: env.MCP_EXTERNAL_TOOLS_READ_ONLY },
    },
    databases: {
      postgresql: { configured: Boolean(env.DATABASE_URL), authoritative: true },
      supabase: { configured: Boolean(env.SUPABASE_URL), databaseConfigured: Boolean(env.SUPABASE_DATABASE_URL) },
      mongodb: { configured: Boolean(env.MONGO_URL), authoritative: false },
      redis: { configured: Boolean(env.REDIS_URL), rateLimitStore: env.RATE_LIMIT_STORE },
    },
    limits: {
      messageCharacters: 2000,
      globalRequestsPerWindow: env.GLOBAL_RATE_LIMIT,
      globalWindowMs: env.GLOBAL_RATE_WINDOW_MS,
      aiRequestsPerWindow: env.AI_RATE_LIMIT,
      aiWindowMs: env.AI_RATE_WINDOW_MS,
      aiMaxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
    },
    credits: {
      enabled: env.PWRC_CREDITS_ENABLED,
      symbol: env.POWERCHAIN_CREDIT_TOKEN,
      network: env.PWRC_CREDIT_NETWORK,
      mint: env.POWERCHAIN_MINT,
      mintConfigured: Boolean(env.POWERCHAIN_MINT),
      decimals: env.PWRC_DECIMALS,
      tokenProgram: env.PWRC_TOKEN_PROGRAM_ID,
      completedResponseCostPwrc: env.COPILOT_MESSAGE_PRICE_PWRC.toString(),
      completedResponseCostBaseUnits: env.COPILOT_MESSAGE_PRICE_BASE_UNITS,
      referenceUsdPerPwrc: "0.000002",
      referencePriceIsLive: false,
      topupsEnabled: env.PWRC_TOPUPS_ENABLED,
    },
  }));
}
