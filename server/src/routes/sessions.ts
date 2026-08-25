import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../lib/session";
import { prisma } from "../lib/prisma";

export async function registerSessionRoutes(
  app: FastifyInstance,
) {
  app.get("/api/v1/account/sessions", async (request) => {
    const { user, session } = await authenticate(request);

    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      sessions: sessions.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        expiresAt: item.expiresAt.toISOString(),
        current: item.id === session.id,
        ipAddress: item.ipAddress,
        userAgent: item.userAgent,
      })),
    };
  });

  app.delete(
    "/api/v1/account/sessions/others",
    async (request, reply) => {
      const { user, session } = await authenticate(request);

      await prisma.session.updateMany({
        where: {
          userId: user.id,
          id: { not: session.id },
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      return reply.code(204).send();
    },
  );

  app.delete(
    "/api/v1/account/sessions/:id",
    async (request, reply) => {
      const { user } = await authenticate(request);
      const { id } = z.object({ id: z.string() }).parse(request.params);

      await prisma.session.updateMany({
        where: {
          id,
          userId: user.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      return reply.code(204).send();
    },
  );
}
