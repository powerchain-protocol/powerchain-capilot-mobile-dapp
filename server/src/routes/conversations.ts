import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../lib/session";
import { prisma } from "../lib/prisma";
import { receiptView } from "../credits/service";

function messageView(message: any) {
  return {
    id: message.id,
    role:
      message.role === "USER"
        ? "user"
        : message.role === "ASSISTANT"
          ? "assistant"
          : "system",
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    model: message.model ?? undefined,
    status: "sent",
    creditReceipt: message.pwrcReceipt ? receiptView(message.pwrcReceipt) : undefined,
  };
}

export async function registerConversationRoutes(
  app: FastifyInstance,
) {
  app.get("/api/v1/ai/conversations", async (request) => {
    const { user } = await authenticate(request);

    const query = z
      .object({
        cursor: z.string().optional(),
      })
      .parse(request.query);

    const items = await prisma.aiConversation.findMany({
      where: { userId: user.id },
      orderBy: {
        updatedAt: "desc",
      },
      take: 31,
      ...(query.cursor
        ? {
            cursor: { id: query.cursor },
            skip: 1,
          }
        : {}),
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const hasMore = items.length > 30;
    const page = hasMore ? items.slice(0, 30) : items;

    return {
      items: page.map((conversation) => ({
        id: conversation.id,
        title: conversation.title ?? "New conversation",
        preview: conversation.messages[0]?.content ?? "",
        updatedAt: conversation.updatedAt.toISOString(),
      })),
      nextCursor:
        hasMore && page.length
          ? page[page.length - 1].id
          : null,
    };
  });

  app.get("/api/v1/ai/conversations/:id", async (request, reply) => {
    const { user } = await authenticate(request);
    const { id } = z.object({ id: z.string() }).parse(request.params);

    const conversation = await prisma.aiConversation.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { pwrcReceipt: true },
        },
      },
    });

    if (!conversation) {
      return reply.code(404).send({
        error: "conversation_not_found",
      });
    }

    return {
      id: conversation.id,
      title: conversation.title,
      context: conversation.context,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: conversation.messages.map(messageView),
    };
  });

  app.delete(
    "/api/v1/ai/conversations/:id",
    async (request, reply) => {
      const { user } = await authenticate(request);
      const { id } = z.object({ id: z.string() }).parse(request.params);

      const result = await prisma.aiConversation.deleteMany({
        where: {
          id,
          userId: user.id,
        },
      });

      if (!result.count) {
        return reply.code(404).send({
          error: "conversation_not_found",
        });
      }

      await prisma.auditEvent.create({
        data: {
          userId: user.id,
          action: "conversation.deleted",
          resourceType: "conversation",
          resourceId: id,
          requestId: request.id,
        },
      });

      return reply.code(204).send();
    },
  );
}
