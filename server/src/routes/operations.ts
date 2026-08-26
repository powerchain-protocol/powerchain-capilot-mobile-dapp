import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { RequestAuthenticator } from '../../api/credits-handler.ts';
import { loadServerEnv } from '../../config/env.ts';
import { loadNetworkConfig } from '../../config/networks.ts';
import { OperationsGatewayClient, OperationsGatewayError } from '../../operations/gateway.ts';
import { assertCursor, parsePageLimit, type PublicRuntimeConfig, type SafeActionRequest } from '../../../packages/operations-contracts/src/index.ts';

function publicConfig(source: NodeJS.ProcessEnv): PublicRuntimeConfig {
  const env = loadServerEnv(source);
  const networks = loadNetworkConfig(source);
  const backendConfigured = Boolean(env.operations.backendUrl && env.operations.bearerSecret);
  return {
    version: '1.0.0',
    dataMode: backendConfigured ? env.operations.dataMode : 'unavailable',
    aiMode: 'managed',
    networks: {
      solana: { cluster: networks.solana.cluster, provider: networks.solana.provider, commitment: networks.solana.commitment },
      sui: { network: networks.sui.network },
    },
    features: {
      ems: backendConfigured && env.operations.features.ems,
      iot: backendConfigured && env.operations.features.iot,
      depin: backendConfigured && env.operations.features.depin,
      marketData: backendConfigured && env.operations.features.marketData,
      safeActions: backendConfigured && env.operations.features.safeActions,
      alarms: backendConfigured && env.operations.features.alarms,
      events: backendConfigured && env.operations.features.events,
      digitalTwin: backendConfigured && env.operations.features.digitalTwin,
    },
    safety: { physicalExecution: false, blockchainExecution: false, signing: 'client_wallet_only', safeActions: 'prepare_only' },
    limits: { pageSizeDefault: env.operations.pageSizeDefault, pageSizeMax: env.operations.pageSizeMax, ingestBatchMax: env.operations.ingestBatchMax },
  };
}

function authRequest(request: FastifyRequest) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) for (const part of value) headers.append(key, part);
    else if (value !== undefined) headers.set(key, String(value));
  }
  const protocol = request.protocol || 'http';
  const host = request.headers.host || 'localhost';
  return new Request(`${protocol}://${host}${request.raw.url || request.url}`, { method: request.method, headers });
}

async function withPrincipal(
  request: FastifyRequest,
  reply: FastifyReply,
  authenticate: RequestAuthenticator,
  handler: (principal: { userId: string }) => Promise<unknown>,
) {
  try {
    const principal = await authenticate(authRequest(request));
    if (!principal?.userId) return reply.code(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
    return await handler(principal);
  } catch (error) {
    if (error instanceof OperationsGatewayError) return reply.code(error.status).send({ error: { code: error.code, message: error.message, ...(error.requestId ? { requestId: error.requestId } : {}) } });
    throw error;
  }
}

function requiredSiteId(request: FastifyRequest) {
  const raw = (request.query as { siteId?: unknown }).siteId;
  const siteId = typeof raw === 'string' ? raw.trim() : '';
  if (!siteId || siteId.length > 256) return null;
  return siteId;
}

function pagination(request: FastifyRequest, max: number, fallback: number) {
  const query = request.query as { cursor?: unknown; limit?: unknown };
  return { cursor: assertCursor(query.cursor), limit: parsePageLimit(query.limit, fallback, max) };
}

export async function registerOperationsRoutes(app: FastifyInstance, input: { authenticate: RequestAuthenticator; source?: NodeJS.ProcessEnv }) {
  const source = input.source ?? process.env;
  const env = loadServerEnv(source);
  const gateway = new OperationsGatewayClient({ baseUrl: env.operations.backendUrl, bearerSecret: env.operations.bearerSecret, timeoutMs: env.operations.timeoutMs });

  for (const path of ['/api/v1/health', '/api/v1/capilot-mobile/health', '/api/v1/copilot-mobile/health']) {
    app.get(path, async (_request, reply) => {
      const health = await gateway.health();
      return reply.header('cache-control', 'no-store').code(health.status === 'not_ready' ? 503 : 200).send(health);
    });
  }
  for (const path of ['/api/v1/config', '/api/v1/capilot-mobile/config', '/api/v1/copilot-mobile/config']) {
    app.get(path, async (_request, reply) => reply.header('cache-control', 'no-store').send(publicConfig(source)));
  }

  const aliases = ['', '/capilot-mobile', '/copilot-mobile'];
  for (const prefix of aliases) {
    app.get(`/api/v1${prefix}/sites`, async (request, reply) => withPrincipal(request, reply, input.authenticate, async (principal) => {
      return reply.header('cache-control', 'no-store').send(await gateway.sites(principal));
    }));

    app.get(`/api/v1${prefix}/ems/overview`, async (request, reply) => withPrincipal(request, reply, input.authenticate, async (principal) => {
      const siteId = requiredSiteId(request);
      if (!siteId) return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: 'siteId is required.' } });
      return reply.header('cache-control', 'no-store').send(await gateway.emsOverview(principal, siteId));
    }));

    app.get(`/api/v1${prefix}/iot/devices`, async (request, reply) => withPrincipal(request, reply, input.authenticate, async (principal) => {
      const siteId = requiredSiteId(request);
      if (!siteId) return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: 'siteId is required.' } });
      try { return reply.header('cache-control', 'no-store').send(await gateway.iotDevices(principal, siteId, pagination(request, env.operations.pageSizeMax, env.operations.pageSizeDefault))); }
      catch (error) { if (error instanceof Error && /limit|cursor/i.test(error.message)) return reply.code(400).send({ error: { code: 'INVALID_PAGINATION', message: error.message } }); throw error; }
    }));

    app.get(`/api/v1${prefix}/depin/nodes`, async (request, reply) => withPrincipal(request, reply, input.authenticate, async (principal) => {
      const siteId = requiredSiteId(request);
      if (!siteId) return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: 'siteId is required.' } });
      try { return reply.header('cache-control', 'no-store').send(await gateway.depinNodes(principal, siteId, pagination(request, env.operations.pageSizeMax, env.operations.pageSizeDefault))); }
      catch (error) { if (error instanceof Error && /limit|cursor/i.test(error.message)) return reply.code(400).send({ error: { code: 'INVALID_PAGINATION', message: error.message } }); throw error; }
    }));

    app.get(`/api/v1${prefix}/alarms`, async (request, reply) => withPrincipal(request, reply, input.authenticate, async (principal) => {
      const siteId = requiredSiteId(request);
      if (!siteId) return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: 'siteId is required.' } });
      const rawState = (request.query as { state?: unknown }).state;
      const state = typeof rawState === 'string' ? rawState.trim() : undefined;
      if (state && !['open', 'acknowledged', 'resolved'].includes(state)) return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: 'Invalid alarm state.' } });
      try { return reply.header('cache-control', 'no-store').send(await gateway.alarms(principal, siteId, { ...pagination(request, env.operations.pageSizeMax, env.operations.pageSizeDefault), state })); }
      catch (error) { if (error instanceof Error && /limit|cursor/i.test(error.message)) return reply.code(400).send({ error: { code: 'INVALID_PAGINATION', message: error.message } }); throw error; }
    }));

    app.get(`/api/v1${prefix}/events`, async (request, reply) => withPrincipal(request, reply, input.authenticate, async (principal) => {
      const siteId = requiredSiteId(request);
      if (!siteId) return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: 'siteId is required.' } });
      const rawKind = (request.query as { kind?: unknown }).kind;
      const kind = typeof rawKind === 'string' ? rawKind.trim() : undefined;
      if (kind && !['telemetry', 'device', 'depin', 'alarm', 'action', 'provider', 'system'].includes(kind)) return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: 'Invalid event kind.' } });
      try { return reply.header('cache-control', 'no-store').send(await gateway.events(principal, siteId, { ...pagination(request, env.operations.pageSizeMax, env.operations.pageSizeDefault), kind })); }
      catch (error) { if (error instanceof Error && /limit|cursor/i.test(error.message)) return reply.code(400).send({ error: { code: 'INVALID_PAGINATION', message: error.message } }); throw error; }
    }));

    app.get(`/api/v1${prefix}/twin`, async (request, reply) => withPrincipal(request, reply, input.authenticate, async (principal) => {
      const siteId = requiredSiteId(request);
      if (!siteId) return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: 'siteId is required.' } });
      return reply.header('cache-control', 'no-store').send(await gateway.twin(principal, siteId));
    }));

    app.get(`/api/v1${prefix}/telemetry/integrity`, async (request, reply) => withPrincipal(request, reply, input.authenticate, async (principal) => {
      const siteId = requiredSiteId(request);
      if (!siteId) return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: 'siteId is required.' } });
      return reply.header('cache-control', 'no-store').send(await gateway.telemetryIntegrity(principal, siteId));
    }));

    app.post(`/api/v1${prefix}/actions/execute`, async (request, reply) => withPrincipal(request, reply, input.authenticate, async () => {
      return reply.code(405).header('cache-control', 'no-store').send({ error: { code: 'PHYSICAL_EXECUTION_DISABLED', message: 'Physical, blockchain, and server-side wallet-signing execution is disabled. Use Safe Actions preparation only.' } });
    }));

    app.get(`/api/v1${prefix}/market-data/prices`, async (request, reply) => withPrincipal(request, reply, input.authenticate, async (principal) => {
      const raw = (request.query as { symbols?: unknown }).symbols;
      const symbols = typeof raw === 'string' ? raw.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean).slice(0, 20) : [];
      if (!symbols.length) return reply.code(400).send({ error: { code: 'INVALID_REQUEST', message: 'symbols is required.' } });
      return reply.header('cache-control', 'no-store').send(await gateway.marketPrices(principal, symbols));
    }));

    app.post(`/api/v1${prefix}/actions/prepare`, async (request, reply) => withPrincipal(request, reply, input.authenticate, async (principal) => {
      const body = request.body as SafeActionRequest;
      const idempotencyKey = request.headers['idempotency-key'];
      const headerKey = Array.isArray(idempotencyKey) ? idempotencyKey[0] : idempotencyKey;
      if (!headerKey || body?.idempotencyKey !== headerKey) {
        return reply.code(400).send({ error: { code: 'INVALID_IDEMPOTENCY_KEY', message: 'Body idempotencyKey must match Idempotency-Key header.' } });
      }
      return reply.header('cache-control', 'no-store').code(201).send(await gateway.prepareAction(principal, body));
    }));
  }
}
