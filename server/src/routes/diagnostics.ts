import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { RequestAuthenticator } from '../../api/credits-handler.ts';
import { loadServerEnv } from '../../config/env.ts';
import { loadNetworkConfig } from '../../config/networks.ts';
import { loadCorsPolicy } from '../cors/policy.ts';

function authRequest(request: FastifyRequest) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) for (const item of value) headers.append(key, item);
    else if (value !== undefined) headers.set(key, String(value));
  }
  return new Request(`${request.protocol || 'http'}://${request.headers.host || 'localhost'}${request.raw.url || request.url}`, { method: request.method, headers });
}

export async function registerDiagnosticsRoutes(app: FastifyInstance, input: {
  authenticate: RequestAuthenticator;
  source?: NodeJS.ProcessEnv;
  configuredProviders?: () => string[];
}) {
  const source = input.source ?? process.env;
  const env = loadServerEnv(source);
  const network = loadNetworkConfig(source);
  const cors = loadCorsPolicy(source);

  for (const path of ['/api/v1/cors', '/api/v1/cors/', '/api/v1/capilot-mobile/cors', '/api/v1/copilot-mobile/cors']) {
    app.get(path, async (_request, reply) => reply.header('cache-control', 'no-store').send({
      enabled: cors.allowedOrigins.size > 0,
      allowCredentials: cors.allowCredentials,
      configuredOriginCount: cors.allowedOrigins.size,
      maxAgeSeconds: cors.maxAgeSeconds,
    }));
  }

  for (const path of ['/api/v1/diagnostics', '/api/v1/capilot-mobile/diagnostics', '/api/v1/copilot-mobile/diagnostics']) {
    app.get(path, async (request, reply) => {
      const principal = await input.authenticate(authRequest(request));
      if (!principal?.userId) return reply.code(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
      return reply.header('cache-control', 'no-store').send({
        service: 'powerchain-copilot-mobile',
        version: '1.0.0',
        ai: {
          mode: 'managed',
          providers: input.configuredProviders?.() ?? [],
          fallbackEnabled: env.ai.fallbackEnabled,
          readiness: env.ai.providerOrder.map((name) => ({ name, status: (input.configuredProviders?.() ?? []).includes(name) ? 'configured' : 'not_configured' })),
        },
        chat: { enabled: env.chat.enabled, encryptedAtRest: Boolean(env.chat.encryptionKey), memoryEnabled: env.chat.memoryEnabled },
        operations: { configured: Boolean(env.operations.backendUrl && env.operations.bearerSecret), dataMode: env.operations.dataMode, features: env.operations.features },
        networks: {
          solana: { cluster: network.solana.cluster, provider: network.solana.provider, commitment: network.solana.commitment },
          sui: { network: network.sui.network },
        },
        rateLimit: { store: env.rateLimit.store },
        generatedAt: new Date().toISOString(),
      });
    });
  }
}
