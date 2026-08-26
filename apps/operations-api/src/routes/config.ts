import { Router } from "express";
import type { PublicPlatformConfig } from "@powerchain/energy-contracts";
import { compatibility, config } from "../config.js";
import { marketDataProviderIds } from "../clients/market-data.js";

export const configRouter = Router();

configRouter.get("/", (_request, response) => {
  const supabaseUses: Array<"auth" | "realtime"> = [];
  if (config.OPERATIONS_AUTH_PROVIDER === "supabase") supabaseUses.push("auth");
  if (config.SUPABASE_REALTIME_ENABLED) supabaseUses.push("realtime");

  const payload: PublicPlatformConfig = {
    version: config.APP_VERSION,
    environment: config.NODE_ENV,
    mode:
      config.OPERATIONS_DATA_MODE === "demo"
        ? "simulation"
        : config.OPERATIONS_DATA_MODE as PublicPlatformConfig["mode"],
    apiPrefix: config.OPERATIONS_API_PREFIX,
    compatibility,
    networks: {
      solana: {
        cluster: config.SOLANA_NETWORK,
        provider: config.SOLANA_RPC_URL.includes("helius") ? "helius" : "custom",
        configured: true,
        readOnly: true,
      },
      sui: {
        network: config.SUI_NETWORK,
        configured: true,
        readOnly: true,
      },
    },
    features: {
      ems: true,
      iot: true,
      depin: true,
      marketData: marketDataProviderIds.length > 0,
      safeActions: true,
      physicalExecution: false,
      settlementExecution: false,
    },
    providers: {
      auth: config.OPERATIONS_AUTH_PROVIDER,
      wallet: ["solana", "sui"],
      marketData: marketDataProviderIds,
      realtime: config.SUPABASE_REALTIME_ENABLED ? "supabase" : "disabled",
    },
    databases: {
      postgresql: {
        configured: Boolean(config.OPERATIONS_DATABASE_URL),
        authoritative: true,
      },
      supabase: {
        configured: Boolean(config.SUPABASE_URL),
        authoritative: false,
        uses: supabaseUses,
      },
    },
  };

  response.json(payload);
});
