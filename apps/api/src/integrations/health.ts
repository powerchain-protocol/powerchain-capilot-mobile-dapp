import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { getSuiLatestCheckpoint } from "./sui";
import { pingMongo } from "../lib/mongo.js";
import { pingRedis } from "../lib/redis.js";
import { aiProviderStatus } from "./ai-providers.js";
import { mcpConfiguration } from "../mcp/config.js";

type Status =
  | "operational"
  | "degraded"
  | "unavailable"
  | "misconfigured"
  | "unknown";

async function timed<T>(
  fn: () => Promise<T>,
): Promise<{ value?: T; latencyMs: number; error?: Error }> {
  const started = Date.now();
  try {
    return { value: await fn(), latencyMs: Date.now() - started };
  } catch (error) {
    return {
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

async function checkDatabase() {
  const result = await timed(async () => {
    await prisma.$queryRaw`SELECT 1`;
  });
  return {
    id: "postgres" as const,
    name: "PostgreSQL / Prisma",
    status: (result.error ? "unavailable" : "operational") as Status,
    message: result.error ? "PostgreSQL unavailable." : "PostgreSQL operational.",
    checkedAt: new Date().toISOString(),
    latencyMs: result.latencyMs,
  };
}

async function checkMongo() {
  if (!env.MONGO_URL) {
    return {
      id: "mongo" as const,
      name: "MongoDB",
      status: "unknown" as Status,
      message: "MongoDB is optional and not configured.",
      checkedAt: new Date().toISOString(),
    };
  }
  const result = await timed(pingMongo);
  return {
    id: "mongo" as const,
    name: "MongoDB",
    status: (result.error ? "degraded" : "operational") as Status,
    message: result.error ? "MongoDB health check failed." : "MongoDB operational.",
    checkedAt: new Date().toISOString(),
    latencyMs: result.latencyMs,
  };
}

async function checkRedis() {
  if (!env.REDIS_URL) {
    return {
      id: "redis" as const,
      name: "Redis",
      status: env.RATE_LIMIT_STORE === "redis" ? "misconfigured" as Status : "unknown" as Status,
      message: env.RATE_LIMIT_STORE === "redis"
        ? "Redis rate-limit store selected but REDIS_URL is missing."
        : "Redis is optional and not configured.",
      checkedAt: new Date().toISOString(),
    };
  }
  const result = await timed(pingRedis);
  return {
    id: "redis" as const,
    name: "Redis",
    status: (result.error ? "degraded" : "operational") as Status,
    message: result.error ? "Redis health check failed." : "Redis operational.",
    checkedAt: new Date().toISOString(),
    latencyMs: result.latencyMs,
  };
}

async function checkAiProviders() {
  const providers = aiProviderStatus();
  const configured = providers.filter((provider) => provider.configured);
  const primary = providers.find((provider) => provider.id === env.AI_PRIMARY_PROVIDER);
  return {
    id: "ai" as const,
    name: "PowerChain Managed AI",
    status: (primary?.configured
      ? "operational"
      : configured.length
        ? "degraded"
        : "misconfigured") as Status,
    message: primary?.configured
      ? `Primary ${env.AI_PRIMARY_PROVIDER} configured; ${configured.length} provider(s) available.`
      : configured.length
        ? `Primary ${env.AI_PRIMARY_PROVIDER} unavailable; fallback provider(s) configured.`
        : "No AI provider is configured.",
    checkedAt: new Date().toISOString(),
  };
}


function checkMcp() {
  const config = mcpConfiguration();
  if (!config.enabled) {
    return {
      id: "mcp" as const,
      name: "MCP Gateway",
      status: "unknown" as Status,
      message: "MCP tool calling is disabled.",
      checkedAt: new Date().toISOString(),
    };
  }

  if (!config.servers.length) {
    return {
      id: "mcp" as const,
      name: "MCP Gateway",
      status: "misconfigured" as Status,
      message: "MCP is enabled but no server is configured.",
      checkedAt: new Date().toISOString(),
    };
  }

  return {
    id: "mcp" as const,
    name: "MCP Gateway",
    status: "operational" as Status,
    message: `${config.servers.length} MCP server(s) configured behind read-only policy controls.`,
    checkedAt: new Date().toISOString(),
  };
}

async function checkPyth() {
  if (!env.PYTH_API_KEY) {
    return {
      id: "pyth" as const,
      name: "Pyth",
      status: "misconfigured" as Status,
      message: "Pyth API key is not configured.",
      checkedAt: new Date().toISOString(),
    };
  }
  const result = await timed(async () => {
    const response = await fetch(env.PYTH_HERMES_URL, {
      method: "HEAD",
      headers: { Authorization: `Bearer ${env.PYTH_API_KEY}` },
    });
    if (!response.ok && response.status >= 500) {
      throw new Error("Pyth unavailable.");
    }
  });
  return {
    id: "pyth" as const,
    name: "Pyth",
    status: (result.error ? "degraded" : "operational") as Status,
    message: result.error ? "Oracle service check failed." : "Oracle service reachable.",
    checkedAt: new Date().toISOString(),
    latencyMs: result.latencyMs,
  };
}

async function checkBirdeye() {
  if (!env.BIRDEYE_API_KEY) {
    return {
      id: "birdeye" as const,
      name: "Birdeye",
      status: "misconfigured" as Status,
      message: "Birdeye API key is not configured.",
      checkedAt: new Date().toISOString(),
    };
  }
  return {
    id: "birdeye" as const,
    name: "Birdeye",
    status: "operational" as Status,
    message: "Market-data provider configured.",
    checkedAt: new Date().toISOString(),
  };
}

async function checkSolana() {
  const result = await timed(async () => {
    const response = await fetch(env.SOLANA_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth", params: [] }),
    });
    if (!response.ok) throw new Error("Solana RPC unavailable.");
    const payload = (await response.json()) as { result?: string; error?: unknown };
    if (payload.error || payload.result !== "ok") throw new Error("Solana RPC degraded.");
  });
  return {
    id: "solana" as const,
    name: "Solana",
    status: (result.error ? "degraded" : "operational") as Status,
    message: result.error
      ? "Solana RPC health check failed."
      : `${env.SOLANA_NETWORK} ${env.SOLANA_RPC_PROVIDER_EFFECTIVE} RPC operational.`,
    checkedAt: new Date().toISOString(),
    latencyMs: result.latencyMs,
  };
}

async function checkSui() {
  const result = await timed(async () => {
    await getSuiLatestCheckpoint();
  });
  return {
    id: "sui" as const,
    name: "Sui",
    status: (result.error ? "degraded" : "operational") as Status,
    message: result.error ? "Sui RPC health check failed." : `${env.SUI_NETWORK} RPC operational.`,
    checkedAt: new Date().toISOString(),
    latencyMs: result.latencyMs,
  };
}

export async function getIntegrationHealth() {
  return Promise.all([
    checkAiProviders(),
    Promise.resolve(checkMcp()),
    checkSolana(),
    checkSui(),
    checkPyth(),
    checkBirdeye(),
    checkDatabase(),
    checkMongo(),
    checkRedis(),
  ]);
}
