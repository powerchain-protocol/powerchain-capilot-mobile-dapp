import type { FastifyInstance } from "fastify";
import { authenticate } from "../lib/session";
import { env } from "../config/env";
import { getSuiLatestCheckpoint } from "../integrations/sui";

export async function registerSuiRoutes(app: FastifyInstance) {
  app.get("/api/v1/sui/health", async (request) => {
    await authenticate(request);

    const latestCheckpoint = await getSuiLatestCheckpoint();

    return {
      network: env.SUI_NETWORK,
      latestCheckpoint,
      status: "ok",
    };
  });
}
