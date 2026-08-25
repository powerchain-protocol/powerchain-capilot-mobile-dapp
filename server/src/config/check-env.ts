import { env } from "./env";

const safe = {
  NODE_ENV: env.NODE_ENV,
  LOG_LEVEL: env.LOG_LEVEL,
  PORT: env.PORT,
  HOST: env.HOST,
  CORS_ORIGIN: env.CORS_ORIGIN,
  DATABASE_URL: env.DATABASE_URL ? "configured" : "missing",
  SOLANA_NETWORK: env.SOLANA_NETWORK,
  SOLANA_RPC_URL: env.SOLANA_RPC_URL,
  SUI_NETWORK: env.SUI_NETWORK,
  SUI_RPC_URL: env.SUI_RPC_URL,
  OPENAI_API_KEY: env.OPENAI_API_KEY ? "configured" : "not configured",
  PYTH_API_KEY: env.PYTH_API_KEY ? "configured" : "not configured",
  BIRDEYE_API_KEY: env.BIRDEYE_API_KEY ? "configured" : "not configured",
  PWRC_CREDITS_ENABLED: env.PWRC_CREDITS_ENABLED,
  PWRC_CREDIT_NETWORK: env.PWRC_CREDIT_NETWORK,
  PWRC_CREDIT_ACK_TTL_SECONDS: env.PWRC_CREDIT_ACK_TTL_SECONDS,
  PWRC_TOPUPS_ENABLED: env.PWRC_TOPUPS_ENABLED,
  PWRC_TREASURY_ADDRESS: env.PWRC_TREASURY_ADDRESS ? "configured" : "not configured",
  PAYMENT_KERNEL_WEBHOOK_SECRET: env.PAYMENT_KERNEL_WEBHOOK_SECRET ? "configured" : "not configured",
  PAYMENT_KERNEL_WEBHOOK_MAX_SKEW_SECONDS: env.PAYMENT_KERNEL_WEBHOOK_MAX_SKEW_SECONDS,
};

console.log("PowerChain API environment");
console.table(safe);
