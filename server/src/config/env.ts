import "dotenv/config";
import bs58 from "bs58";
import { z } from "zod";
import {
  PWRC_MINT as CANONICAL_PWRC_MINT,
  PWRC_NETWORK as CANONICAL_PWRC_NETWORK,
  PWRC_TOKEN_2022_PROGRAM as CANONICAL_TOKEN_2022_PROGRAM,
} from "@powerchain/pwrc-credits";

const booleanValue = z
  .enum(["true", "false"])
  .transform((value) => value === "true");


function validCorsOrigin(value: string) {
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.pathname === "/" &&
      !parsed.search &&
      !parsed.hash &&
      parsed.username === "" &&
      parsed.password === ""
    );
  } catch {
    return false;
  }
}

function validBase58Bytes(value: string, expectedLength: number) {
  try {
    return bs58.decode(value).length === expectedLength;
  } catch {
    return false;
  }
}

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().min(1).default("0.0.0.0"),

  CORS_ORIGIN: z.string().min(1).default("http://localhost:8081,http://localhost:19006,http://localhost:3000"),
  CORS_ALLOW_LOCALHOST: booleanValue.default("true"),
  CORS_CREDENTIALS: booleanValue.default("false"),
  CORS_MAX_AGE_SECONDS: z.coerce.number().int().min(0).max(86400).default(86400),
  TRUST_PROXY: booleanValue.default("false"),
  BODY_LIMIT_BYTES: z.coerce
    .number()
    .int()
    .min(64 * 1024)
    .max(20 * 1024 * 1024)
    .default(1024 * 1024),

  DATABASE_URL: z.string().min(1),

  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),

  AI_RATE_LIMIT: z.coerce.number().int().min(1).max(1000).default(30),
  AI_RATE_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(60 * 60 * 1000)
    .default(60_000),

  OPENAI_API_KEY: z.string().trim().optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.6-terra"),

  SOLANA_RPC_URL: z
    .string()
    .url()
    .default("https://api.devnet.solana.com"),
  SOLANA_NETWORK: z
    .enum(["devnet", "mainnet-beta"])
    .default("devnet"),
  SOLANA_COMMITMENT: z
    .enum(["processed", "confirmed", "finalized"])
    .default("confirmed"),

  TOKEN_2022_PROGRAM: z
    .string()
    .min(32)
    .max(64)
    .default(CANONICAL_TOKEN_2022_PROGRAM),

  PWRC_MINT: z
    .string()
    .min(32)
    .max(64)
    .default(CANONICAL_PWRC_MINT),

  USDC_MINT: z
    .string()
    .min(32)
    .max(64)
    .default("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),

  EURC_MINT: z.string().trim().optional(),

  SUI_NETWORK: z
    .enum(["devnet", "testnet", "mainnet"])
    .default("testnet"),
  SUI_RPC_URL: z
    .string()
    .url()
    .default("https://fullnode.testnet.sui.io:443"),

  PYTH_API_KEY: z.string().trim().optional(),
  PYTH_HERMES_URL: z
    .string()
    .url()
    .default("https://pyth.dourolabs.app/hermes"),

  BIRDEYE_API_KEY: z.string().trim().optional(),
  BIRDEYE_BASE_URL: z
    .string()
    .url()
    .default("https://public-api.birdeye.so"),

  MARKET_CACHE_FRESH_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(60 * 60 * 1000)
    .default(30_000),

  MARKET_CACHE_STALE_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(24 * 60 * 60 * 1000)
    .default(300_000),


  PWRC_CREDITS_ENABLED: booleanValue.default("true"),
  PWRC_CREDIT_NETWORK: z
    .enum(["devnet", "mainnet-beta"])
    .default("mainnet-beta"),
  PWRC_CREDIT_RESERVATION_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(30)
    .max(3600)
    .default(600),
  PWRC_CREDIT_ACK_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(15)
    .max(600)
    .default(120),
  PWRC_CREDIT_REAPER_ENABLED: booleanValue.default("true"),
  PWRC_CREDIT_REAPER_INTERVAL_SECONDS: z.coerce
    .number()
    .int()
    .min(10)
    .max(3600)
    .default(60),
  PWRC_LOW_CREDIT_RESPONSES: z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(10),
  PWRC_DEMO_GRANT_ENABLED: booleanValue.default("true"),
  PWRC_TOPUPS_ENABLED: booleanValue.default("false"),
  PWRC_TOPUP_TTL_MINUTES: z.coerce
    .number()
    .int()
    .min(5)
    .max(1440)
    .default(30),
  PWRC_TREASURY_ADDRESS: z.string().trim().optional(),
  PAYMENT_KERNEL_WEBHOOK_SECRET: z.string().trim().optional(),
  PAYMENT_KERNEL_WEBHOOK_MAX_SKEW_SECONDS: z.coerce
    .number()
    .int()
    .min(30)
    .max(3600)
    .default(300),

  MCP_ENABLED: booleanValue.default("false"),
  MCP_SERVERS_JSON: z.string().default("[]"),
  MCP_ALLOWED_HOSTS: z.string().default(""),
  MCP_MAX_SERVERS: z.coerce.number().int().min(0).max(16).default(8),
  MCP_MAX_TOOLS: z.coerce.number().int().min(0).max(64).default(24),
  MCP_MAX_TOOL_CALLS: z.coerce.number().int().min(0).max(12).default(4),
  MCP_MAX_ARGUMENT_BYTES: z.coerce.number().int().min(256).max(65536).default(8192),
  MCP_MAX_TOOL_SCHEMA_BYTES: z.coerce.number().int().min(1024).max(262144).default(65536),
  MCP_MAX_RESULT_CHARS: z.coerce.number().int().min(256).max(100000).default(12000),
  MCP_TOOL_TIMEOUT_MS: z.coerce.number().int().min(500).max(120000).default(15000),
})
.superRefine((value, ctx) => {
  if (value.MARKET_CACHE_STALE_MS < value.MARKET_CACHE_FRESH_MS) {
    ctx.addIssue({
      code: "custom",
      path: ["MARKET_CACHE_STALE_MS"],
      message: "MARKET_CACHE_STALE_MS must be >= MARKET_CACHE_FRESH_MS.",
    });
  }


  if (value.CORS_ORIGIN !== "*") {
    const origins = value.CORS_ORIGIN
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (origins.length === 0 || origins.some((origin) => !validCorsOrigin(origin))) {
      ctx.addIssue({
        code: "custom",
        path: ["CORS_ORIGIN"],
        message: "CORS_ORIGIN must contain comma-separated http(s) origins without paths, queries, credentials, or fragments.",
      });
    }
  }

  if (
    value.NODE_ENV === "production" &&
    value.CORS_ORIGIN === "*"
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["CORS_ORIGIN"],
      message: "Production CORS_ORIGIN may not be '*'.",
    });
  }


  if (value.NODE_ENV === "production" && value.CORS_ALLOW_LOCALHOST) {
    ctx.addIssue({
      code: "custom",
      path: ["CORS_ALLOW_LOCALHOST"],
      message: "Production may not enable CORS_ALLOW_LOCALHOST.",
    });
  }

  if (
    value.NODE_ENV === "production" &&
    value.CORS_ORIGIN.split(",").some((origin) => /localhost|127\.0\.0\.1|\[::1\]/i.test(origin))
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["CORS_ORIGIN"],
      message: "Production CORS_ORIGIN may not contain localhost origins.",
    });
  }

  if (
    value.PAYMENT_KERNEL_WEBHOOK_SECRET &&
    value.PAYMENT_KERNEL_WEBHOOK_SECRET.length < 32
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["PAYMENT_KERNEL_WEBHOOK_SECRET"],
      message: "PAYMENT_KERNEL_WEBHOOK_SECRET must be at least 32 characters when configured.",
    });
  }

  if (
    value.PWRC_CREDITS_ENABLED &&
    value.PWRC_CREDIT_NETWORK === CANONICAL_PWRC_NETWORK &&
    value.PWRC_MINT !== CANONICAL_PWRC_MINT
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["PWRC_MINT"],
      message: "PWRC mainnet-beta credits must use the canonical PowerChain PWRC mint.",
    });
  }

  if (
    value.PWRC_CREDITS_ENABLED &&
    value.TOKEN_2022_PROGRAM !== CANONICAL_TOKEN_2022_PROGRAM
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["TOKEN_2022_PROGRAM"],
      message: "PWRC credits require the canonical Solana Token-2022 program.",
    });
  }

  if (value.NODE_ENV === "production" && value.PWRC_DEMO_GRANT_ENABLED) {
    ctx.addIssue({
      code: "custom",
      path: ["PWRC_DEMO_GRANT_ENABLED"],
      message: "Production may not enable PWRC demo grants.",
    });
  }

  if (
    value.PWRC_TREASURY_ADDRESS &&
    !validBase58Bytes(value.PWRC_TREASURY_ADDRESS, 32)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["PWRC_TREASURY_ADDRESS"],
      message: "PWRC_TREASURY_ADDRESS must be a valid 32-byte Solana base58 public key.",
    });
  }

  if (
    value.NODE_ENV === "production" &&
    value.PWRC_TOPUPS_ENABLED &&
    (!value.PWRC_TREASURY_ADDRESS || !value.PAYMENT_KERNEL_WEBHOOK_SECRET)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["PWRC_TOPUPS_ENABLED"],
      message:
        "Production PWRC top-ups require PWRC_TREASURY_ADDRESS and PAYMENT_KERNEL_WEBHOOK_SECRET.",
    });
  }

  if (value.NODE_ENV === "production" && value.MCP_ENABLED) {
    if (!value.MCP_ALLOWED_HOSTS.trim()) {
      ctx.addIssue({ code: "custom", path: ["MCP_ALLOWED_HOSTS"], message: "Production MCP requires an explicit hostname allowlist." });
    }
    try {
      const servers = JSON.parse(value.MCP_SERVERS_JSON);
      if (!Array.isArray(servers)) throw new Error("not array");
      for (const server of servers) {
        if (!Array.isArray(server?.allowedTools) || server.allowedTools.length === 0) {
          ctx.addIssue({ code: "custom", path: ["MCP_SERVERS_JSON"], message: "Every production MCP server requires a non-empty allowedTools list." });
          break;
        }
      }
    } catch {
      ctx.addIssue({ code: "custom", path: ["MCP_SERVERS_JSON"], message: "MCP_SERVERS_JSON must be valid JSON array configuration." });
    }
  }

});

export const env = schema.parse(process.env);

export type ServerEnvironment = typeof env;
