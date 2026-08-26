import type { FastifyInstance } from "fastify";
import { forwardOperationalRequest } from "../integrations/operations.js";

export async function registerOperationsRoutes(app: FastifyInstance) {
  app.get("/api/v1/operations/health", async (request) => forwardOperationalRequest(request, undefined, "/health"));
  app.get("/api/v1/operations/config", async (request) => forwardOperationalRequest(request, undefined, "/config"));
  app.get("/api/v1/sites", async (request) => forwardOperationalRequest(request));
  app.get("/api/v1/ems/overview", async (request) => forwardOperationalRequest(request));
  app.get("/api/v1/ems/flow", async (request) => forwardOperationalRequest(request));
  app.post("/api/v1/flow/validate", async (request) => forwardOperationalRequest(request, request.body));
  app.get("/api/v1/iot/devices", async (request) => forwardOperationalRequest(request));
  app.get("/api/v1/iot/devices/:deviceId/telemetry", async (request) => forwardOperationalRequest(request));
  app.get("/api/v1/depin/nodes", async (request) => forwardOperationalRequest(request));
  app.get("/api/v1/depin/summary", async (request) => forwardOperationalRequest(request));
  app.get("/api/v1/market-data/prices", async (request) => forwardOperationalRequest(request));
  app.get("/api/v1/alarms", async (request) => forwardOperationalRequest(request));
  app.get("/api/v1/events", async (request) => forwardOperationalRequest(request));
  app.get("/api/v1/twin", async (request) => forwardOperationalRequest(request));
  app.get("/api/v1/exports/:siteId/evidence.json", async (request) => forwardOperationalRequest(request));
  app.get("/api/v1/exports/:siteId/snapshot.json", async (request) => forwardOperationalRequest(request));
  app.post("/api/v1/actions/prepare", async (request) => forwardOperationalRequest(request, request.body));
}
