import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { loadServerEnv } from '../config/env.ts';
import { registerSystemRoutes } from './routes/system.ts';
import { registerMcpAdminRoutes } from './routes/mcp.ts';
import { registerOperationsRoutes } from './routes/operations.ts';
import { registerChatRoutes } from './routes/chat.ts';
import { registerDiagnosticsRoutes } from './routes/diagnostics.ts';
import { registerAiBoundaryRoutes } from './routes/ai-boundaries.ts';
import { registerApiDocsRoutes } from './routes/api-docs.ts';
import { loadCorsPolicy, corsHeaders } from './cors/policy.ts';
import { MemoryRateLimitStore, RedisRateLimitStore, type RateLimitStore } from '../rate-limit/store.ts';
import { enforceRateLimit, RateLimitExceededError } from '../rate-limit/limiter.ts';
import type { RequestAuthenticator } from '../api/credits-handler.ts';
import type { ChatPersistence } from '../chat/types.ts';
import type { PrismaAiMemoryService } from '../ai/memory/service.ts';

function webRequestFromFastify(request: FastifyRequest) {
  const protocol = request.protocol || 'http';
  const host = request.headers.host || 'localhost';
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) for (const part of value) headers.append(key, part);
    else if (value !== undefined) headers.set(key, String(value));
  }
  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(request.body ?? {});
  const rawUrl = request.raw.url || request.url;
  const canonicalUrl = rawUrl
    .replace(/^\/api\/v1\/capilot-mobile\/credits/, '/api/v1/credits')
    .replace(/^\/api\/v1\/copilot-mobile\/credits/, '/api/v1/credits')
    .replace(/^\/api\/v1\/capilot-mobile\/copilot/, '/api/v1/copilot')
    .replace(/^\/api\/v1\/copilot-mobile\/copilot/, '/api/v1/copilot');
  return new Request(`${protocol}://${host}${canonicalUrl}`, { method, headers, body });
}

async function sendWebResponse(reply: FastifyReply, response: Response) {
  for (const [key, value] of response.headers) reply.header(key, value);
  const body = await response.text();
  return reply.code(response.status).send(body ? JSON.parse(body) : undefined);
}

export type PowerChainHandlers = {
  credits(request: Request): Promise<Response>;
  copilot(request: Request): Promise<Response>;
  authenticate: RequestAuthenticator;
};

export async function createFastifyApp(input: {
  handlers: PowerChainHandlers;
  source?: NodeJS.ProcessEnv;
  redis?: { incr(key: string): Promise<number>; pexpire(key: string, ttl: number): Promise<unknown>; pttl(key: string): Promise<number> } | null;
  managedAiProviders?: string[];
  chat?: ChatPersistence | null;
  memory?: PrismaAiMemoryService | null;
}) {
  const source = input.source ?? process.env;
  const env = loadServerEnv(source);
  const cors = loadCorsPolicy(source);
  const app = Fastify({ logger: true, bodyLimit: 1024 * 1024, requestIdHeader: 'x-request-id' });
  const rateStore: RateLimitStore = env.rateLimit.store === 'redis'
    ? (() => { if (!input.redis) throw new Error('RATE_LIMIT_STORE=redis requires REDIS_URL and a Redis connection.'); return new RedisRateLimitStore(input.redis); })()
    : new MemoryRateLimitStore();

  app.setErrorHandler(async (error, _request, reply) => {
    if (error instanceof RateLimitExceededError) {
      return reply.code(429).header('retry-after', Math.max(1, Math.ceil((error.resetAt - Date.now()) / 1000))).send({ error: { code: error.code, message: error.message } });
    }
    requestLogSafe(app, error);
    return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' } });
  });

  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
    const originHeader = request.headers.origin;
    const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
    const headers = corsHeaders(origin, cors);
    for (const [key, value] of Object.entries(headers)) reply.header(key, value);
    if (request.method === 'OPTIONS') {
      if (origin && !headers['access-control-allow-origin']) {
        return reply.code(403).send({ error: { code: 'CORS_ORIGIN_DENIED', message: 'Origin is not allowed.' } });
      }
      return reply.code(204).send();
    }
  });

  app.addHook('preHandler', async (request) => {
    const webRequest = webRequestFromFastify(request);
    await enforceRateLimit({ request: webRequest, store: rateStore, namespace: 'global', limit: env.rateLimit.globalLimit, windowMs: env.rateLimit.globalWindowMs });
    const pathname = new URL(webRequest.url).pathname;
    if (pathname.startsWith('/api/v1/auth/')) {
      await enforceRateLimit({ request: webRequest, store: rateStore, namespace: 'auth', limit: env.rateLimit.authLimit, windowMs: env.rateLimit.globalWindowMs });
    }
  });

  app.get('/health/live', async () => ({ status: 'ok', service: 'powerchain-copilot-mobile', version: '1.0.0' }));
  app.get('/health/ready', async (_request, reply) => {
    const providers = input.managedAiProviders ?? [];
    const ready = providers.length > 0;
    return reply.code(ready ? 200 : 503).send({ status: ready ? 'ready' : 'not_ready', managedAiProviders: providers });
  });

  await registerApiDocsRoutes(app);
  await registerSystemRoutes(app, source);
  await registerMcpAdminRoutes(app, source);
  await registerOperationsRoutes(app, { authenticate: input.handlers.authenticate, source });
  await registerChatRoutes(app, { authenticate: input.handlers.authenticate, chat: input.chat, memory: input.memory });
  await registerAiBoundaryRoutes(app, { authenticate: input.handlers.authenticate, source, configuredProviders: () => input.managedAiProviders ?? [] });
  await registerDiagnosticsRoutes(app, { authenticate: input.handlers.authenticate, source, configuredProviders: () => input.managedAiProviders ?? [] });

  const creditPrefixes = ['/api/v1/credits', '/api/v1/capilot-mobile/credits', '/api/v1/copilot-mobile/credits'];
  for (const prefix of creditPrefixes) {
    for (const path of [prefix, `${prefix}/*`]) {
      app.route({ method: ['GET', 'POST'], url: path, handler: async (request, reply) => sendWebResponse(reply, await input.handlers.credits(webRequestFromFastify(request))) });
    }
  }

  const copilotPaths = [
    { path: '/api/v1/copilot/responses', meteredAi: true },
    { path: '/api/v1/copilot/delivery-ack', meteredAi: false },
    { path: '/api/v1/capilot-mobile/copilot/responses', meteredAi: true },
    { path: '/api/v1/capilot-mobile/copilot/delivery-ack', meteredAi: false },
    { path: '/api/v1/copilot-mobile/copilot/responses', meteredAi: true },
    { path: '/api/v1/copilot-mobile/copilot/delivery-ack', meteredAi: false },
  ];
  for (const route of copilotPaths) {
    app.post(route.path, async (request, reply) => {
      const webRequest = webRequestFromFastify(request);
      if (route.meteredAi) {
        await enforceRateLimit({ request: webRequest, store: rateStore, namespace: 'ai', limit: env.rateLimit.aiLimit, windowMs: env.rateLimit.aiWindowMs });
      }
      return sendWebResponse(reply, await input.handlers.copilot(webRequest));
    });
  }

  return app;
}

function requestLogSafe(app: FastifyInstance, error: unknown) {
  app.log.error({ err: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error) }, 'request failed');
}
