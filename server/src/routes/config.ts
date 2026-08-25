import type { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { mobileApiMetadata } from "../http/api-namespace";

export async function registerConfigRoutes(app: FastifyInstance) {
  app.get("/api/v1/config", async () => ({
    release: "1.0.0",
    environment: env.NODE_ENV,

    api: {
      ...mobileApiMetadata(),
      corsDiagnostics: "/api/v1/capilot-mobile/cors",
    },

    solana: {
      network: env.SOLANA_NETWORK,
      commitment: env.SOLANA_COMMITMENT,
      token2022Program: env.TOKEN_2022_PROGRAM,
      assets: {
        pwrc: env.PWRC_MINT,
        usdc: env.USDC_MINT,
        eurc: env.EURC_MINT || null,
      },
    },

    sui: {
      network: env.SUI_NETWORK,
    },

    integrations: {
      ai: Boolean(env.OPENAI_API_KEY),
      pyth: Boolean(env.PYTH_API_KEY),
      birdeye: Boolean(env.BIRDEYE_API_KEY),
    },

    limits: {
      messageCharacters: 2000,
    },

    credits: {
      enabled: env.PWRC_CREDITS_ENABLED,
      symbol: "PWRC",
      network: env.PWRC_CREDIT_NETWORK,
      mint: env.PWRC_MINT,
      completedResponseCostPwrc: "10000",
      referenceUsdPerPwrc: "0.000002",
      referencePriceIsLive: false,
      topupsEnabled: env.PWRC_TOPUPS_ENABLED,
    },
  }));
}
