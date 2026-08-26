import { Router } from "express";
import type { PublicPlatformConfig } from "@powerchain/energy-contracts";
import { config, marketProviders } from "../config.js";

export const configRouter = Router();

configRouter.get("/", (_request, response) => {
  const payload: PublicPlatformConfig = {
    version: "1.0.0",
    environment: config.NODE_ENV,
    mode:
      config.ENERGY_DATA_MODE === "demo"
        ? "simulation"
        : (config.ENERGY_DATA_MODE as PublicPlatformConfig["mode"]),
    apiPrefix: config.ENERGY_API_PREFIX,
    networks: {
      solana: {
        cluster: config.SOLANA_NETWORK,
        provider: config.SOLANA_RPC_URL.includes("helius") ? "helius" : "custom",
        configured: Boolean(config.SOLANA_RPC_URL),
      },
      sui: {
        network: config.SUI_NETWORK,
        configured: Boolean(config.SUI_RPC_URL),
      },
    },
    features: {
      ems: true,
      iot: true,
      depin: true,
      safeActions: true,
    },
    providers: {
      auth: config.ENERGY_AUTH_PROVIDER,
      wallet: ["solana", "sui"],
      marketData: marketProviders,
    },
    databases: {
      postgresql: { configured: Boolean(config.ENERGY_DATABASE_URL), authoritative: true },
      supabase: { configured: Boolean(config.SUPABASE_URL) },
    },
  };
  response.json(payload);
});
