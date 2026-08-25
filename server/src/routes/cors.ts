import type { FastifyInstance } from "fastify";
import { corsDiagnostics } from "../http/cors-policy";

export async function registerCorsRoutes(app: FastifyInstance) {
  const handler = async (request: { headers: { origin?: string } }) =>
    corsDiagnostics(request.headers.origin);

  app.get("/api/v1/cors", handler);
  app.get("/api/v1/cors/", handler);
}
