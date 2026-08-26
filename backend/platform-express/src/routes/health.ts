import { Router } from "express";
import type { SystemHealth } from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";
import { config } from "../config.js";

export const healthRouter = Router();

function mode(): SystemHealth["mode"] {
  if (config.ENERGY_DATA_MODE === "demo") return "simulation";
  return config.ENERGY_DATA_MODE as SystemHealth["mode"];
}

healthRouter.get("/", async (_request, response) => {
  let databaseStatus: "healthy" | "unavailable" = "healthy";
  let databaseDetail = "PostgreSQL reachable";
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseStatus = "unavailable";
    databaseDetail = "PostgreSQL unavailable";
  }

  const payload: SystemHealth = {
    ok: databaseStatus === "healthy",
    service: "powerchain-energy-platform-backend",
    version: "1.0.0",
    mode: mode(),
    checkedAt: new Date().toISOString(),
    checks: [
      {
        id: "postgresql",
        label: "PostgreSQL",
        status: databaseStatus,
        configured: Boolean(config.ENERGY_DATABASE_URL),
        latencyMs: Date.now() - started,
        detail: databaseDetail,
      },
      {
        id: "supabase",
        label: "Supabase Auth",
        status: config.ENERGY_AUTH_PROVIDER === "supabase" ? "healthy" : "misconfigured",
        configured: Boolean(config.SUPABASE_URL && config.SUPABASE_PUBLISHABLE_KEY),
        detail:
          config.ENERGY_AUTH_PROVIDER === "supabase"
            ? "Selected authentication provider"
            : "Not selected for authentication",
      },
      {
        id: "solana",
        label: "Solana",
        status: "healthy",
        configured: Boolean(config.SOLANA_RPC_URL),
        detail: config.SOLANA_NETWORK,
      },
      {
        id: "sui",
        label: "Sui",
        status: "healthy",
        configured: Boolean(config.SUI_RPC_URL),
        detail: config.SUI_NETWORK,
      },
    ],
  };

  response.status(payload.ok ? 200 : 503).json(payload);
});

healthRouter.get("/live", (_request, response) =>
  response.json({
    ok: true,
    service: "powerchain-energy-platform-backend",
    version: "1.0.0",
  }),
);

healthRouter.get("/ready", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({
      ok: true,
      database: "ready",
      version: "1.0.0",
    });
  } catch {
    response.status(503).json({
      ok: false,
      database: "unavailable",
      version: "1.0.0",
    });
  }
});
