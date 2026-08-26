import type { Request, Response, Router } from 'express';
import {
  assertCursor,
  assertSafeActionRequest,
  parsePageLimit,
  type AlarmIngestRecord,
  type DepinHeartbeatRecord,
  type EmsIngestRecord,
  type IngestEnvelope,
  type IotHeartbeatRecord,
  type PublicRuntimeConfig,
  type SafeActionRequest,
} from '@powerchain/operations-contracts';
import type { OperationsAuthAdapter } from '../adapters/auth.ts';
import { hasInternalBearer } from '../adapters/auth.ts';
import type { OperationsAccessAdapter } from '../adapters/access.ts';
import { authorizeSafeAction } from '../adapters/action-access.ts';
import type { MarketDataClient } from '../clients/market-data.ts';
import { OperationsApiError } from '../errors.ts';
import { requestId } from '../http/request-context.ts';
import type { SafeActionService } from '../actions/safe-action.ts';
import type { AlarmService } from '../services/alarms.ts';
import type { DepinService } from '../services/depin.ts';
import type { EmsService } from '../services/ems.ts';
import type { EventService } from '../services/events.ts';
import type { IngestService } from '../services/ingest.ts';
import type { IotService } from '../services/iot.ts';
import type { TwinService } from '../services/twin.ts';
import type { SiteService } from '../services/sites.ts';

async function principalOr401(auth: OperationsAuthAdapter, req: Request) {
  const principal = await auth.authenticate(req);
  if (!principal) throw new OperationsApiError('UNAUTHENTICATED', 'Internal operations authentication required.', 401);
  return principal;
}

async function requireSiteAccess(access: OperationsAccessAdapter, userId: string, siteId: string) {
  if (await access.canAccessSite(userId, siteId)) return;
  throw new OperationsApiError('SITE_ACCESS_DENIED', 'Access to this energy site is not permitted.', 403);
}

function siteId(req: Request) {
  const value = typeof req.query.siteId === 'string' ? req.query.siteId.trim() : '';
  if (!value || value.length > 256) throw new OperationsApiError('INVALID_REQUEST', 'siteId is required.', 400);
  return value;
}

function pageOptions(req: Request, defaults: { size: number; max: number }) {
  try {
    return { limit: parsePageLimit(req.query.limit, defaults.size, defaults.max), cursor: assertCursor(req.query.cursor) };
  } catch (error) {
    throw new OperationsApiError('INVALID_PAGINATION', error instanceof Error ? error.message : 'Invalid pagination.', 400);
  }
}

function ensureInternalBearer(req: Request, secret: string) {
  if (!hasInternalBearer(req, secret)) throw new OperationsApiError('UNAUTHENTICATED', 'Internal ingestion authentication required.', 401);
}

export function registerV1Routes(router: Router, deps: {
  auth: OperationsAuthAdapter;
  access: OperationsAccessAdapter;
  publicConfig: PublicRuntimeConfig;
  internalBearerSecret: string;
  pageSizeDefault: number;
  pageSizeMax: number;
  ems: EmsService;
  iot: IotService;
  depin: DepinService;
  alarms: AlarmService;
  events: EventService;
  twin: TwinService;
  sites: SiteService;
  ingest: IngestService;
  market: MarketDataClient;
  safeActions: SafeActionService;
}) {
  router.get('/v1/config', async (req, res) => {
    await principalOr401(deps.auth, req);
    res.json(deps.publicConfig);
  });

  router.get('/v1/sites', async (req, res) => {
    const principal = await principalOr401(deps.auth, req);
    res.json({ sites: await deps.sites.listForUser(principal.userId), requestId: requestId(res) });
  });

  router.get('/v1/ems/overview', async (req, res) => {
    const principal = await principalOr401(deps.auth, req);
    const targetSiteId = siteId(req);
    await requireSiteAccess(deps.access, principal.userId, targetSiteId);
    res.json({ overview: await deps.ems.getOverview(targetSiteId), requestId: requestId(res) });
  });

  router.get('/v1/iot/devices', async (req, res) => {
    const principal = await principalOr401(deps.auth, req);
    const targetSiteId = siteId(req);
    await requireSiteAccess(deps.access, principal.userId, targetSiteId);
    const page = pageOptions(req, { size: deps.pageSizeDefault, max: deps.pageSizeMax });
    const result = await deps.iot.listDevices(targetSiteId, page);
    res.json({ devices: result.items, page: result.page, requestId: requestId(res) });
  });

  router.get('/v1/depin/nodes', async (req, res) => {
    const principal = await principalOr401(deps.auth, req);
    const targetSiteId = siteId(req);
    await requireSiteAccess(deps.access, principal.userId, targetSiteId);
    const page = pageOptions(req, { size: deps.pageSizeDefault, max: deps.pageSizeMax });
    const result = await deps.depin.listNodes(targetSiteId, page);
    res.json({ nodes: result.items, page: result.page, requestId: requestId(res) });
  });

  router.get('/v1/alarms', async (req, res) => {
    const principal = await principalOr401(deps.auth, req);
    const targetSiteId = siteId(req);
    await requireSiteAccess(deps.access, principal.userId, targetSiteId);
    const page = pageOptions(req, { size: deps.pageSizeDefault, max: deps.pageSizeMax });
    const state = typeof req.query.state === 'string' ? req.query.state.trim() : undefined;
    if (state && !['open', 'acknowledged', 'resolved'].includes(state)) throw new OperationsApiError('INVALID_REQUEST', 'state must be open, acknowledged, or resolved.', 400);
    const result = await deps.alarms.list(targetSiteId, { ...page, state });
    res.json({ alarms: result.items, page: result.page, requestId: requestId(res) });
  });

  router.get('/v1/events', async (req, res) => {
    const principal = await principalOr401(deps.auth, req);
    const targetSiteId = siteId(req);
    await requireSiteAccess(deps.access, principal.userId, targetSiteId);
    const page = pageOptions(req, { size: deps.pageSizeDefault, max: deps.pageSizeMax });
    const kind = typeof req.query.kind === 'string' ? req.query.kind.trim() : undefined;
    if (kind && !['telemetry', 'device', 'depin', 'alarm', 'action', 'provider', 'system'].includes(kind)) throw new OperationsApiError('INVALID_REQUEST', 'Invalid event kind.', 400);
    const result = await deps.events.list(targetSiteId, { ...page, kind });
    res.json({ events: result.items, page: result.page, requestId: requestId(res) });
  });

  router.get('/v1/twin', async (req, res) => {
    const principal = await principalOr401(deps.auth, req);
    const targetSiteId = siteId(req);
    await requireSiteAccess(deps.access, principal.userId, targetSiteId);
    res.json({ twin: await deps.twin.get(targetSiteId), requestId: requestId(res) });
  });

  router.get('/v1/telemetry/integrity', async (req, res) => {
    const principal = await principalOr401(deps.auth, req);
    const targetSiteId = siteId(req);
    await requireSiteAccess(deps.access, principal.userId, targetSiteId);
    res.json({ integrity: await deps.twin.integrity(targetSiteId), requestId: requestId(res) });
  });

  router.get('/v1/market-data/prices', async (req, res) => {
    await principalOr401(deps.auth, req);
    const symbols = typeof req.query.symbols === 'string' ? req.query.symbols.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean) : [];
    const normalized = [...new Set(symbols)].slice(0, 20);
    if (!normalized.length) throw new OperationsApiError('INVALID_REQUEST', 'symbols is required.', 400);
    res.json({ prices: await deps.market.getPrices(normalized), requestId: requestId(res) });
  });

  router.post('/v1/actions/prepare', async (req, res) => {
    const principal = await principalOr401(deps.auth, req);
    const request = req.body as SafeActionRequest;
    const idempotencyKey = req.header('idempotency-key')?.trim();
    if (!idempotencyKey || request?.idempotencyKey !== idempotencyKey) throw new OperationsApiError('INVALID_IDEMPOTENCY_KEY', 'Body idempotencyKey must match the Idempotency-Key header.', 400);
    assertSafeActionRequest(request);
    await authorizeSafeAction(deps.access, principal, request);
    res.status(201).json({ decision: await deps.safeActions.prepare(principal, request), requestId: requestId(res) });
  });

  router.post('/v1/actions/execute', async (req, _res) => {
    await principalOr401(deps.auth, req);
    throw new OperationsApiError('PHYSICAL_EXECUTION_DISABLED', 'Physical, blockchain, and wallet-signing execution is disabled. Use /v1/actions/prepare and complete approved execution in an external user-controlled workflow.', 405);
  });

  const ingestion = [
    { path: '/v1/ingest/ems', run: (body: IngestEnvelope<EmsIngestRecord>) => deps.ingest.ems(body) },
    { path: '/v1/ingest/iot-heartbeats', run: (body: IngestEnvelope<IotHeartbeatRecord>) => deps.ingest.iot(body) },
    { path: '/v1/ingest/depin-heartbeats', run: (body: IngestEnvelope<DepinHeartbeatRecord>) => deps.ingest.depin(body) },
    { path: '/v1/ingest/alarms', run: (body: IngestEnvelope<AlarmIngestRecord>) => deps.ingest.alarms(body) },
  ] as const;

  for (const route of ingestion) {
    router.post(route.path, async (req, res) => {
      ensureInternalBearer(req, deps.internalBearerSecret);
      const body = req.body as never;
      const headerKey = req.header('idempotency-key')?.trim();
      if (!headerKey || (body as { idempotencyKey?: string })?.idempotencyKey !== headerKey) throw new OperationsApiError('INVALID_IDEMPOTENCY_KEY', 'Body idempotencyKey must match the Idempotency-Key header.', 400);
      const result = await route.run(body);
      res.status(result.duplicated ? 200 : 202).json({ result, requestId: requestId(res) });
    });
  }
}
