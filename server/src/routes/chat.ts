import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { RequestAuthenticator } from '../../api/credits-handler.ts';
import type { ChatPersistence } from '../../chat/types.ts';
import type { PrismaAiMemoryService } from '../../ai/memory/service.ts';

function webRequest(request: FastifyRequest) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) for (const part of value) headers.append(key, part);
    else if (value !== undefined) headers.set(key, String(value));
  }
  return new Request(`${request.protocol || 'http'}://${request.headers.host || 'localhost'}${request.raw.url || request.url}`, { method: request.method, headers });
}

async function principal(request: FastifyRequest, reply: FastifyReply, authenticate: RequestAuthenticator) {
  const value = await authenticate(webRequest(request));
  if (!value?.userId) { reply.code(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } }); return null; }
  return value;
}

function limitFrom(value: unknown, fallback = 50, max = 500) {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) throw new Error(`limit must be 1..${max}`);
  return parsed;
}

export async function registerChatRoutes(app: FastifyInstance, input: {
  authenticate: RequestAuthenticator;
  chat?: ChatPersistence | null;
  memory?: PrismaAiMemoryService | null;
}) {
  const aliases = ['', '/capilot-mobile', '/copilot-mobile'];
  for (const prefix of aliases) {
    app.post(`/api/v1${prefix}/chat/conversations`, async (request, reply) => {
      const auth = await principal(request, reply, input.authenticate); if (!auth) return;
      if (!input.chat) return reply.code(503).send({ error: { code: 'CHAT_UNAVAILABLE', message: 'Secure chat persistence is not configured.' } });
      try {
        const body = (request.body ?? {}) as { title?: unknown };
        const title = typeof body.title === 'string' ? body.title.trim() : 'New analysis';
        if (title.length > 80) return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: 'title must be 80 characters or fewer.' } });
        const conversation = await input.chat.ensureConversation({ userId: auth.userId, titleSeed: title || 'New analysis' });
        return reply.header('cache-control', 'no-store').code(201).send({ conversation });
      } catch (error) { return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: error instanceof Error ? error.message : 'Invalid request.' } }); }
    });

    app.get(`/api/v1${prefix}/chat/conversations`, async (request, reply) => {
      const auth = await principal(request, reply, input.authenticate); if (!auth) return;
      if (!input.chat) return reply.code(503).send({ error: { code: 'CHAT_UNAVAILABLE', message: 'Secure chat persistence is not configured.' } });
      try {
        const rows = await input.chat.listConversations(auth.userId, limitFrom((request.query as { limit?: unknown }).limit, 50, 100));
        return reply.header('cache-control', 'no-store').send({ conversations: rows });
      } catch (error) { return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: error instanceof Error ? error.message : 'Invalid request.' } }); }
    });

    app.get(`/api/v1${prefix}/chat/conversations/:conversationId/messages`, async (request, reply) => {
      const auth = await principal(request, reply, input.authenticate); if (!auth) return;
      if (!input.chat) return reply.code(503).send({ error: { code: 'CHAT_UNAVAILABLE', message: 'Secure chat persistence is not configured.' } });
      try {
        const id = String((request.params as { conversationId: string }).conversationId || '').trim();
        const rows = await input.chat.listMessages(auth.userId, id, limitFrom((request.query as { limit?: unknown }).limit, 100, 500));
        return reply.header('cache-control', 'no-store').send({ messages: rows });
      } catch (error) { return reply.code(404).send({ error: { code: 'CONVERSATION_NOT_FOUND', message: error instanceof Error ? error.message : 'Conversation not found.' } }); }
    });

    app.get(`/api/v1${prefix}/ai/memory`, async (request, reply) => {
      const auth = await principal(request, reply, input.authenticate); if (!auth) return;
      if (!input.memory) return reply.code(503).send({ error: { code: 'MEMORY_UNAVAILABLE', message: 'AI memory is not configured.' } });
      const conversationId = typeof (request.query as { conversationId?: unknown }).conversationId === 'string' ? String((request.query as { conversationId?: string }).conversationId) : undefined;
      const memories = await input.memory.listMemories({ userId: auth.userId, conversationId, limit: 32 });
      return reply.header('cache-control', 'no-store').send({ memories });
    });

    app.post(`/api/v1${prefix}/ai/memory`, async (request, reply) => {
      const auth = await principal(request, reply, input.authenticate); if (!auth) return;
      if (!input.memory) return reply.code(503).send({ error: { code: 'MEMORY_UNAVAILABLE', message: 'AI memory is not configured.' } });
      try {
        const body = request.body as { conversationId?: unknown; kind?: unknown; content?: unknown };
        const memory = await input.memory.remember({
          userId: auth.userId,
          conversationId: typeof body.conversationId === 'string' ? body.conversationId : undefined,
          kind: typeof body.kind === 'string' ? body.kind as any : 'context',
          content: typeof body.content === 'string' ? body.content : '',
        });
        return reply.header('cache-control', 'no-store').code(201).send({ memory });
      } catch (error) { return reply.code(400).send({ error: { code: 'INVALID_MEMORY', message: error instanceof Error ? error.message : 'Invalid memory.' } }); }
    });

    app.delete(`/api/v1${prefix}/ai/memory/:memoryId`, async (request, reply) => {
      const auth = await principal(request, reply, input.authenticate); if (!auth) return;
      if (!input.memory) return reply.code(503).send({ error: { code: 'MEMORY_UNAVAILABLE', message: 'AI memory is not configured.' } });
      await input.memory.forget(auth.userId, String((request.params as { memoryId: string }).memoryId || ''));
      return reply.header('cache-control', 'no-store').code(204).send();
    });
  }
}
