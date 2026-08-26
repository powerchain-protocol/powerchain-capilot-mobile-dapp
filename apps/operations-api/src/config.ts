import "dotenv/config";
import { z } from "zod";

if (!process.env.OPERATIONS_DATABASE_URL && process.env.ENERGY_DATABASE_URL) {
  process.env.OPERATIONS_DATABASE_URL = process.env.ENERGY_DATABASE_URL;
}
if (!process.env.OPERATIONS_API_PREFIX && process.env.ENERGY_API_PREFIX) {
  process.env.OPERATIONS_API_PREFIX = process.env.ENERGY_API_PREFIX;
}

const bool = z.enum(["true", "false"]).transform((value) => value === "true");
const optionalUrl = z.union([z.string().url(), z.literal("")]).optional();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_VERSION: z.string().default("1.0.0"),
  OPERATIONS_API_HOST: z.string().default("127.0.0.1"),
  OPERATIONS_API_PORT: z.coerce.number().int().positive().default(8200),
  OPERATIONS_API_PREFIX: z.string().default("/api/v1"),
  OPERATIONS_DATA_MODE: z.enum(["live", "read_only", "simulation", "maintenance", "demo"]).default("live"),
  OPERATIONS_DATABASE_URL: z.string().min(1),
  OPERATIONS_AUTH_PROVIDER: z.enum(["internal", "supabase", "development"]).default("development"),
  OPERATIONS_INTERNAL_SECRET: z.string().optional().default(""),
  INGESTION_INTERNAL_SECRET: z.string().optional().default(""),
  SUPABASE_URL: optionalUrl,
  SUPABASE_PUBLISHABLE_KEY: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  SUPABASE_REALTIME_ENABLED: bool.default("false"),
  SUPABASE_REALTIME_CHANNEL: z.string().default("powerchain-operations"),
  SOLANA_NETWORK: z.enum(["devnet", "mainnet-beta"]).default("devnet"),
  SOLANA_RPC_URL: z.string().url(),
  SUI_NETWORK: z.enum(["devnet", "testnet", "mainnet"]).default("devnet"),
  SUI_RPC_URL: z.string().url(),
  MARKET_DATA_PROVIDERS: z.string().default("coingecko"),
  PYTH_HERMES_URL: z.string().url().default("https://hermes.pyth.network"),
  BIRDEYE_BASE_URL: z.string().url().default("https://public-api.birdeye.so"),
  BIRDEYE_API_KEY: z.string().optional().default(""),
  COINGECKO_API_BASE_URL: z.string().url().default("https://api.coingecko.com/api/v3"),
  COINGECKO_API_KEY: z.string().optional().default(""),
  TELEMETRY_FRESH_SECONDS: z.coerce.number().int().min(1).default(30),
  LIVE_FLOW_TOLERANCE_MW: z.string().regex(/^-?\d+(?:\.\d+)?$/).default("0.005"),
  PROVIDER_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  PROVIDER_MAX_RESPONSE_BYTES: z.coerce.number().int().min(1024).max(5_000_000).default(524288),
  TELEMETRY_STALE_SECONDS: z.coerce.number().int().min(2).default(120),
  SAFE_ACTION_TTL_SECONDS: z.coerce.number().int().min(30).max(900).default(180),
  SAFE_ACTION_REAPER_INTERVAL_MS: z.coerce.number().int().min(5000).max(300000).default(30000),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().min(1000).max(300000).default(15000),
  OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(100).default(20),
  OUTBOX_MAX_BACKOFF_SECONDS: z.coerce.number().int().min(5).max(3600).default(300),
  CORS_ORIGINS: z.string().default("http://127.0.0.1:8081,http://localhost:8081"),
  CONTRACTS_VERSION: z.string().default("1.0.0"),
  DATABASE_SCHEMA_VERSION: z.string().default("20260826100000"),
  EVENT_SCHEMA_VERSION: z.string().default("1.0.0"),
});

export const config = schema.parse(process.env);

if (config.TELEMETRY_STALE_SECONDS <= config.TELEMETRY_FRESH_SECONDS) {
  throw new Error("TELEMETRY_STALE_SECONDS must be greater than TELEMETRY_FRESH_SECONDS.");
}
if (config.NODE_ENV === "production" && config.OPERATIONS_AUTH_PROVIDER === "development") {
  throw new Error("OPERATIONS_AUTH_PROVIDER=development is forbidden in production.");
}
if (config.NODE_ENV === "production" && config.OPERATIONS_AUTH_PROVIDER === "internal" && !config.OPERATIONS_INTERNAL_SECRET) {
  throw new Error("OPERATIONS_INTERNAL_SECRET is required for internal auth in production.");
}

if (config.NODE_ENV === "production" && !config.INGESTION_INTERNAL_SECRET) {
  throw new Error("INGESTION_INTERNAL_SECRET is required in production.");
}
if (config.OPERATIONS_AUTH_PROVIDER === "supabase" && (!config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error("Supabase auth requires SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.");
}
if (config.SUPABASE_REALTIME_ENABLED && (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY)) {
  throw new Error("Supabase Realtime publishing requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}

export const marketProviders = config.MARKET_DATA_PROVIDERS.split(",").map((v) => v.trim()).filter(Boolean);
export const allowedOrigins = new Set(config.CORS_ORIGINS.split(",").map((v) => v.trim()).filter(Boolean));
export const compatibility = {
  applicationVersion: config.APP_VERSION,
  contractsVersion: config.CONTRACTS_VERSION,
  databaseSchemaVersion: config.DATABASE_SCHEMA_VERSION,
  eventSchemaVersion: config.EVENT_SCHEMA_VERSION,
  apiVersion: "v1" as const,
};
