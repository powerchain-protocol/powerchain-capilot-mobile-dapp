import type { FastifyInstance } from "fastify";
import {
  MOBILE_API_CORRECTED_ALIAS,
  MOBILE_API_PREFIX,
  mobileApiMetadata,
} from "../http/api-namespace";

export async function registerCapilotMobileRoutes(app: FastifyInstance) {
  const handler = async () => ({
    ok: true,
    service: "powerchain-copilot-mobile-api",
    version: "1.0.0",
    namespace: mobileApiMetadata(),
    routes: {
      health: `${MOBILE_API_PREFIX}/health`,
      config: `${MOBILE_API_PREFIX}/config`,
      cors: `${MOBILE_API_PREFIX}/cors`,
      auth: `${MOBILE_API_PREFIX}/auth`,
      copilot: `${MOBILE_API_PREFIX}/ai`,
      chat: `${MOBILE_API_PREFIX}/chat`,
      operations: `${MOBILE_API_PREFIX}/sites`,
      ems: `${MOBILE_API_PREFIX}/ems`,
      iot: `${MOBILE_API_PREFIX}/iot`,
      depin: `${MOBILE_API_PREFIX}/depin`,
      alarms: `${MOBILE_API_PREFIX}/alarms`,
      events: `${MOBILE_API_PREFIX}/events`,
      twin: `${MOBILE_API_PREFIX}/twin`,
      credits: `${MOBILE_API_PREFIX}/credits`,
      mcp: `${MOBILE_API_PREFIX}/mcp`,
    },
    aliases: [MOBILE_API_CORRECTED_ALIAS],
  });

  app.get(MOBILE_API_PREFIX, handler);
  app.get(`${MOBILE_API_PREFIX}/`, handler);
  app.get(MOBILE_API_CORRECTED_ALIAS, handler);
  app.get(`${MOBILE_API_CORRECTED_ALIAS}/`, handler);
}
