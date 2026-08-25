import type { FastifyInstance } from "fastify";
import { authenticate } from "../lib/session";
import { getIntegrationHealth } from "../integrations/health";

function overallStatus(
  statuses: string[],
) {
  if (statuses.some((status) => status === "unavailable")) {
    return "unavailable";
  }

  if (
    statuses.some(
      (status) =>
        status === "degraded" ||
        status === "misconfigured",
    )
  ) {
    return "degraded";
  }

  if (statuses.every((status) => status === "operational")) {
    return "operational";
  }

  return "unknown";
}

export async function registerIntegrationRoutes(
  app: FastifyInstance,
) {
  app.get("/api/v1/integrations/status", async (request) => {
    await authenticate(request);

    const items = await getIntegrationHealth();

    return {
      overall: overallStatus(items.map((item) => item.status)),
      items,
    };
  });
}
