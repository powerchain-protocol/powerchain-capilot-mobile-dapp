import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../lib/session.js";
import { prisma } from "../lib/prisma.js";
import { revealMessageContent } from "../chat/message-security.js";
import { receiptView } from "../credits/service.js";

/** Secure read-only chat namespace. Generation remains /api/v1/ai/chat so billing has one authority. */
export async function registerChatRoutes(app: FastifyInstance) {
  app.get("/api/v1/chat/:conversationId/messages", async (request, reply) => {
    const { user } = await authenticate(request);
    const { conversationId } = z.object({ conversationId: z.string().min(1) }).parse(request.params);
    const query = z.object({ cursor: z.string().optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }).parse(request.query);
    const conversation = await prisma.aiConversation.findFirst({ where: { id: conversationId, userId: user.id }, select: { id: true } });
    if (!conversation) return reply.code(404).send({ error: "conversation_not_found" });
    const rows = await prisma.aiMessage.findMany({
      where: { conversationId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}), include: { pwrcReceipt: true },
    });
    const hasMore = rows.length > query.limit;
    const page = (hasMore ? rows.slice(0, query.limit) : rows).reverse();
    return {
      conversationId,
      items: page.map((m) => ({ id: m.id, slug: m.slug, role: m.role.toLowerCase(), content: revealMessageContent(m), createdAt: m.createdAt.toISOString(), model: m.model, provider: m.provider, contentHash: m.contentHash, creditReceipt: m.pwrcReceipt ? receiptView(m.pwrcReceipt) : undefined })),
      nextCursor: hasMore ? rows[query.limit - 1]?.id ?? null : null,
    };
  });
}
