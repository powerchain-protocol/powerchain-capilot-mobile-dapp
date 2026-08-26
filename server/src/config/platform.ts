import { env } from "./env.js";
import { aiProviderStatus } from "../integrations/ai-providers.js";
import { sanitizedSolanaRuntime } from "./solana.js";

function configured(value: unknown) {
  return Boolean(typeof value === "string" ? value.trim() : value);
}

export function sanitizedPlatformRuntime() {
  return {
    application: {
      name: env.APP_NAME,
      version: env.APP_VERSION,
      environment: env.APP_ENV,
      nodeEnv: env.NODE_ENV,
      apiPrefix: env.API_PREFIX,
      debug: env.DEBUG,
    },
    databases: {
      postgresql: {
        configured: configured(env.DATABASE_URL),
        role: "authoritative-transactional-source-of-record",
        prismaDirectConfigured: configured(env.DIRECT_URL),
        accelerateConfigured: configured(env.PRISMA_ACCELERATE_URL),
      },
      supabase: {
        sdkConfigured: configured(env.SUPABASE_URL) && configured(env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY),
        serviceRoleConfigured: configured(env.SUPABASE_SERVICE_ROLE_KEY),
        databaseConfigured: configured(env.SUPABASE_DATABASE_URL),
        directDatabaseConfigured: configured(env.SUPABASE_DIRECT_URL),
        role: "optional-hosted-postgres-auth-and-platform-integration",
      },
      mongodb: {
        configured: configured(env.MONGO_URL),
        role: "auxiliary-document-store",
      },
      redis: {
        configured: configured(env.REDIS_URL),
        rateLimitStore: env.RATE_LIMIT_STORE,
        cacheEnabled: env.CACHE_ENABLED,
        role: "cache-rate-limit-and-ephemeral-coordination",
      },
    },
    ai: {
      mode: env.AI_MODE,
      primaryProvider: env.AI_PRIMARY_PROVIDER,
      providerOrder: env.AI_PROVIDER_ORDER_PARSED,
      fallbackEnabled: env.AI_FALLBACK_ENABLED,
      providers: aiProviderStatus(),
    },
    marketData: {
      pyth: { enabled: env.PYTH_ENABLED, configured: configured(env.PYTH_API_KEY), publicEndpointConfigured: configured(env.PYTH_HERMES_URL) },
      birdeye: { enabled: env.FEATURE_BIRDEYE, configured: configured(env.BIRDEYE_API_KEY) },
      coingecko: { enabled: env.COINGECKO_ENABLED && env.FEATURE_COINGECKO, configured: configured(env.COINGECKO_API_KEY), plan: env.COINGECKO_API_PLAN },
      coinmarketcap: { enabled: env.COINMARKETCAP_ENABLED && env.FEATURE_COINMARKETCAP, configured: configured(env.COINMARKETCAP_API_KEY) },
      jupiter: { enabled: env.JUPITER_ENABLED && env.FEATURE_JUPITER, configured: configured(env.JUPITER_API_KEY) },
    },
    networks: {
      solana: sanitizedSolanaRuntime(),
      sui: {
        network: env.SUI_NETWORK,
        configured: configured(env.SUI_RPC_URL),
        powerchainPackageConfigured: configured(env.POWERCHAIN_SUI_PACKAGE_ID),
        wrappedPwrcConfigured: configured(env.WPWRC_SUI_COIN_TYPE),
      },
    },
    mcp: {
      enabled: env.MCP_ENABLED,
      policyMode: env.MCP_POLICY_MODE,
      externalToolsReadOnly: env.MCP_EXTERNAL_TOOLS_READ_ONLY,
      serverCountLimit: env.MCP_MAX_SERVERS,
      toolCountLimit: env.MCP_MAX_TOOLS,
      callCountLimit: env.MCP_MAX_TOOL_CALLS,
    },
    features: {
      solana: env.FEATURE_SOLANA,
      sui: env.FEATURE_SUI,
      pwrc: env.FEATURE_PWRC,
      metaplex: env.FEATURE_METAPLEX,
      solanaPay: env.FEATURE_SOLANA_PAY,
      copilot: env.FEATURE_COPILOT,
      mcp: env.FEATURE_MCP,
    },
    observability: {
      otelEnabled: env.OTEL_ENABLED,
      metricsEnabled: env.METRICS_ENABLED,
      healthcheckEnabled: env.HEALTHCHECK_ENABLED,
      sentryConfigured: configured(env.SENTRY_DSN),
    },
    safety: {
      secretsExposed: false,
      powerchainProgramIdsMayBeUnset: true,
      devnetMayNotImplicitlyUseMainnetPwrcMint: true,
      token2022MetadataIndependentFromMetaplex: true,
    },
  } as const;
}
