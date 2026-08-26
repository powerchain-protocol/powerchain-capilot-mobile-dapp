import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { RequestAuthenticator } from '../../api/credits-handler.ts';
import { loadServerEnv } from '../../config/env.ts';
import { loadLoraRegistry } from '../../lora/registry.ts';
import { listMcpAgentProfiles } from '../mcp/agents/registry.ts';

function authRequest(request: FastifyRequest) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) for (const part of value) headers.append(key, part);
    else if (value !== undefined) headers.set(key, String(value));
  }
  return new Request(`${request.protocol || 'http'}://${request.headers.host || 'localhost'}${request.raw.url || request.url}`, { method: request.method, headers });
}

async function requirePrincipal(request: FastifyRequest, reply: FastifyReply, authenticate: RequestAuthenticator) {
  const principal = await authenticate(authRequest(request));
  if (!principal?.userId) {
    reply.code(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
    return null;
  }
  return principal;
}

export async function registerAiBoundaryRoutes(app: FastifyInstance, input: {
  authenticate: RequestAuthenticator;
  source?: NodeJS.ProcessEnv;
  configuredProviders: () => string[];
}) {
  const source = input.source ?? process.env;
  const env = loadServerEnv(source);
  const aliases = ['', '/capilot-mobile', '/copilot-mobile'];

  for (const prefix of aliases) {
    app.get(`/api/v1${prefix}/ai/runtime`, async (request, reply) => {
      const principal = await requirePrincipal(request, reply, input.authenticate); if (!principal) return;
      const lora = loadLoraRegistry(source);
      return reply.header('cache-control', 'no-store').send({
        mode: 'managed',
        providers: input.configuredProviders(),
        providerOrder: env.ai.providerOrder,
        fallbackEnabled: env.ai.fallbackEnabled,
        memory: { enabled: env.chat.memoryEnabled, userScoped: true, authoritativeOperationalState: false },
        chat: { enabled: env.chat.enabled, encryptedAtRest: Boolean(env.chat.encryptionKey), maxMessageChars: env.chat.maxMessageChars },
        lora: {
          enabled: lora.enabled,
          adapters: lora.adapters.map((adapter) => ({ id: adapter.id, baseModel: adapter.baseModel })),
          remoteAdapterUrlsAllowed: false,
        },
        agents: listMcpAgentProfiles().map((profile) => ({ id: profile.id, maxToolCalls: profile.maxToolCalls, allowedFunctionPrefixes: profile.allowedFunctionPrefixes })),
        boundaries: {
          structuredToolCallsOnly: true,
          mcpResultsTrustedAsInstructions: false,
          providerFallbackAddsPwrcCharge: false,
          physicalExecution: false,
          blockchainExecution: false,
          walletSigning: 'client_wallet_only',
        },
      });
    });

    app.get(`/api/v1${prefix}/ai/readiness`, async (request, reply) => {
      const principal = await requirePrincipal(request, reply, input.authenticate); if (!principal) return;
      const configured = new Set(input.configuredProviders());
      const providers = env.ai.providerOrder.map((name) => ({ name, status: configured.has(name) ? 'configured' : 'not_configured' }));
      const ready = providers.some((provider) => provider.status === 'configured');
      return reply.header('cache-control', 'no-store').code(ready ? 200 : 503).send({
        status: ready ? 'ready' : 'not_ready',
        fallbackEnabled: env.ai.fallbackEnabled,
        providers,
        timeoutMs: env.ai.timeoutMs,
        physicalExecution: false,
      });
    });

    app.get(`/api/v1${prefix}/ai/agents`, async (request, reply) => {
      const principal = await requirePrincipal(request, reply, input.authenticate); if (!principal) return;
      return reply.header('cache-control', 'no-store').send({
        agents: listMcpAgentProfiles().map((profile) => ({
          id: profile.id,
          maxToolCalls: profile.maxToolCalls,
          allowedFunctionPrefixes: profile.allowedFunctionPrefixes,
          purpose: profile.instructions,
        })),
      });
    });

    app.get(`/api/v1${prefix}/ai/lora`, async (request, reply) => {
      const principal = await requirePrincipal(request, reply, input.authenticate); if (!principal) return;
      const lora = loadLoraRegistry(source);
      return reply.header('cache-control', 'no-store').send({
        enabled: lora.enabled,
        adapters: lora.adapters.map((adapter) => ({ id: adapter.id, baseModel: adapter.baseModel })),
        policy: { deploymentLocalPathsOnly: true, adapterPathsExposed: false, remoteUrlsAllowed: false },
      });
    });
  }
}
