import type { FastifyInstance } from "fastify";
import { sanitizedPlatformRuntime } from "../config/platform.js";

export async function registerSystemPlatformRoutes(app: FastifyInstance) {
  app.get("/api/v1/system/platform", async () => sanitizedPlatformRuntime());
}
