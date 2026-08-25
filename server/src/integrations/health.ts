import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { getSuiLatestCheckpoint } from "./sui";

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
    return {
      value: await fn(),
      latencyMs: Date.now() - started,
    };
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
    id: "database" as const,
    name: "PowerChain Data",
    status: (result.error ? "unavailable" : "operational") as Status,
    message: result.error ? "Database unavailable." : "Database operational.",
    checkedAt: new Date().toISOString(),
    latencyMs: result.latencyMs,
  };
}

async function checkOpenAI() {
  if (!env.OPENAI_API_KEY) {
    return {
      id: "openai" as const,
      name: "PowerChain Copilot AI",
      status: "misconfigured" as Status,
      message: "OpenAI provider key is not configured.",
      checkedAt: new Date().toISOString(),
    };
  }

  return {
    id: "openai" as const,
    name: "PowerChain Copilot AI",
    status: "operational" as Status,
    message: "AI provider configured.",
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
      headers: {
        Authorization: `Bearer ${env.PYTH_API_KEY}`,
      },
    });

    if (!response.ok && response.status >= 500) {
      throw new Error("Pyth unavailable.");
    }
  });

  return {
    id: "pyth" as const,
    name: "Pyth",
    status: (result.error ? "degraded" : "operational") as Status,
    message: result.error
      ? "Oracle service check failed."
      : "Oracle service reachable.",
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
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getHealth",
        params: [],
      }),
    });

    if (!response.ok) {
      throw new Error("Solana RPC unavailable.");
    }

    const payload = (await response.json()) as {
      result?: string;
      error?: unknown;
    };

    if (payload.error || payload.result !== "ok") {
      throw new Error("Solana RPC degraded.");
    }
  });

  return {
    id: "solana" as const,
    name: "Solana",
    status: (result.error ? "degraded" : "operational") as Status,
    message: result.error
      ? "Solana RPC health check failed."
      : `${env.SOLANA_NETWORK} RPC operational.`,
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
    message: result.error
      ? "Sui RPC health check failed."
      : `${env.SUI_NETWORK} RPC operational.`,
    checkedAt: new Date().toISOString(),
    latencyMs: result.latencyMs,
  };
}

export async function getIntegrationHealth() {
  return Promise.all([
    checkOpenAI(),
    checkSolana(),
    checkSui(),
    checkPyth(),
    checkBirdeye(),
    checkDatabase(),
  ]);
}
