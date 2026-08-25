import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

async function readiness() {
  await prisma.$queryRaw`SELECT 1`;
  return {
    ok: true,
    database: "ready" as const,
  };
}

export async function registerHealthRoutes(app: FastifyInstance) {
  const live = async () => ({
    ok: true,
    service: "powerchain-copilot-mobile-api",
    version: "1.0.0",
  });

  const ready = async (_request: unknown, reply: any) => {
    try {
      return await readiness();
    } catch {
      return reply.code(503).send({
        ok: false,
        database: "unavailable",
      });
    }
  };

  app.get("/api/v1/health", live);
  app.get("/api/v1/health/live", live);
  app.get("/api/v1/health/ready", ready);

  app.get("/health/live", live);
  app.get("/health/ready", ready);
}
