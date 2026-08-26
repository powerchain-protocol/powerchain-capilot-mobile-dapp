import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ENERGY_API_HOST: z.string().default("127.0.0.1"),
  ENERGY_API_PORT: z.coerce.number().int().positive().default(8200),
  ENERGY_API_PREFIX: z.string().default("/api/v1"),
  ENERGY_DATA_MODE: z.enum(["live", "read_only", "simulation", "maintenance", "demo"]).default("live"),
  ENERGY_DATABASE_URL: z.string().min(1),
  ENERGY_AUTH_PROVIDER: z.enum(["development", "supabase"]).default("development"),
  SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  SOLANA_NETWORK: z.string().default("devnet"),
  SOLANA_RPC_URL: z.string().url(),
  SUI_NETWORK: z.string().default("devnet"),
  SUI_RPC_URL: z.string().url(),
  MARKET_DATA_PROVIDERS: z.string().default("pyth,birdeye,coingecko"),
  ACTION_EXECUTION_ENABLED: z.string().default("false").transform((value) => value === "true"),
  EMS_CONTROL_PLANE_URL: z.string().url().optional().or(z.literal("")),
  EMS_CONTROL_PLANE_SECRET: z.string().optional().default(""),
  IOT_CONTROL_PLANE_URL: z.string().url().optional().or(z.literal("")),
  IOT_CONTROL_PLANE_SECRET: z.string().optional().default(""),
  DEPIN_CONTROL_PLANE_URL: z.string().url().optional().or(z.literal("")),
  DEPIN_CONTROL_PLANE_SECRET: z.string().optional().default(""),
  ACTION_CONFIRMATION_TTL_SECONDS: z.coerce.number().int().min(30).max(600).default(120),
  CORS_ORIGINS: z.string().default("http://127.0.0.1:8081"),
});

export const config = schema.parse(process.env);

if (config.NODE_ENV === "production" && config.ENERGY_AUTH_PROVIDER === "development") {
  throw new Error("ENERGY_AUTH_PROVIDER=development is forbidden in production.");
}
if (
  config.NODE_ENV === "production" &&
  config.ENERGY_AUTH_PROVIDER === "supabase" &&
  (!config.SUPABASE_URL || !config.SUPABASE_PUBLISHABLE_KEY)
) {
  throw new Error("Supabase auth requires SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in production.");
}

export const marketProviders = config.MARKET_DATA_PROVIDERS
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const allowedOrigins = new Set(
  config.CORS_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean),
);
