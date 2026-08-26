import express from 'express';
import type { PublicRuntimeConfig } from '@powerchain/operations-contracts';
import { InternalBearerAuthAdapter } from './adapters/auth.ts';
import { PrismaOperationsAccessAdapter } from './adapters/access.ts';
import { PrismaSafeActionStore } from './actions/prisma-store.ts';
import { SafeActionService } from './actions/safe-action.ts';
import { HttpMarketDataClient } from './clients/market-data.ts';
import { SolanaReadClient } from './clients/solana.ts';
import { SuiReadClient } from './clients/sui.ts';
import { loadOperationsConfig } from './config.ts';
import { createOperationsPrismaClient } from './db/prisma.ts';
import { createSupabaseServerClient, SupabaseOperationsEventPublisher } from './db/supabase.ts';
import { asOperationsApiError } from './errors.ts';
import { requestContext, requestId } from './http/request-context.ts';
import { registerHealthRoutes } from './routes/health.ts';
import { registerV1Routes } from './routes/v1.ts';
import { AlarmService } from './services/alarms.ts';
import { DepinService } from './services/depin.ts';
import { EmsService } from './services/ems.ts';
import { EventService } from './services/events.ts';
import { IngestService } from './services/ingest.ts';
import { IotService } from './services/iot.ts';
import { PrismaAlarmRepository, PrismaDepinRepository, PrismaEmsRepository, PrismaEventRepository, PrismaIotRepository, PrismaTwinAggregateRepository } from './services/repositories.ts';
import { TwinService } from './services/twin.ts';
import { SiteService } from './services/sites.ts';

export async function createOperationsApp(source: NodeJS.ProcessEnv = process.env) {
  const config = loadOperationsConfig(source);
  const prisma = await createOperationsPrismaClient(config.databaseUrl);
  const app = express();
  app.disable('x-powered-by');
  app.set('json escape', true);
  app.use(requestContext);
  app.use(express.json({ limit: '256kb', strict: true, type: 'application/json' }));

  const supabase = createSupabaseServerClient(config.supabase.url, config.supabase.serviceRoleKey);
  const eventsPublisher = new SupabaseOperationsEventPublisher(supabase);
  const auth = new InternalBearerAuthAdapter(config.internalBearerSecret);
  const access = new PrismaOperationsAccessAdapter(prisma);
  const solana = new SolanaReadClient(config.solanaRpcUrl, config.limits.providerTimeoutMs, config.limits.providerResponseMaxBytes);
  const sui = new SuiReadClient(config.suiRpcUrl, config.limits.providerTimeoutMs, config.limits.providerResponseMaxBytes);
  const market = new HttpMarketDataClient({
    ...config.marketData,
    mode: config.dataMode,
    timeoutMs: config.limits.providerTimeoutMs,
    maxResponseBytes: config.limits.providerResponseMaxBytes,
  });
  const ems = new EmsService(new PrismaEmsRepository(prisma), config.freshness.telemetrySeconds, config.dataMode);
  const iot = new IotService(new PrismaIotRepository(prisma), config.freshness.iotSeconds, config.dataMode);
  const depin = new DepinService(new PrismaDepinRepository(prisma), config.freshness.depinSeconds, config.dataMode);
  const alarms = new AlarmService(new PrismaAlarmRepository(prisma), config.freshness.alarmSeconds, config.dataMode);
  const operationalEvents = new EventService(new PrismaEventRepository(prisma), config.freshness.eventSeconds, config.dataMode);
  const twin = new TwinService(ems, new PrismaTwinAggregateRepository(prisma));
  const sites = new SiteService(prisma);
  const ingest = new IngestService(prisma, config.limits.ingestBatchMax);
  const safeActions = new SafeActionService(new PrismaSafeActionStore(prisma), config.safeActionTtlSeconds);

  const publicConfig: PublicRuntimeConfig = {
    version: '1.0.0',
    dataMode: config.dataMode,
    aiMode: 'managed',
    networks: {
      solana: { cluster: 'configured-upstream', provider: 'custom', commitment: 'confirmed' },
      sui: { network: 'configured-upstream' },
    },
    features: config.features,
    safety: {
      physicalExecution: false,
      blockchainExecution: false,
      signing: 'client_wallet_only',
      safeActions: 'prepare_only',
    },
    limits: {
      pageSizeDefault: config.limits.pageSizeDefault,
      pageSizeMax: config.limits.pageSizeMax,
      ingestBatchMax: config.limits.ingestBatchMax,
    },
  };

  registerHealthRoutes(app, {
    solana,
    sui,
    market,
    databaseHealth: async () => { await prisma.$queryRawUnsafe('SELECT 1'); },
    supabaseConfigured: Boolean(supabase),
  });
  registerV1Routes(app, {
    auth,
    access,
    publicConfig,
    internalBearerSecret: config.internalBearerSecret,
    pageSizeDefault: config.limits.pageSizeDefault,
    pageSizeMax: config.limits.pageSizeMax,
    ems,
    iot,
    depin,
    alarms,
    events: operationalEvents,
    twin,
    sites,
    ingest,
    market,
    safeActions,
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const normalized = asOperationsApiError(error);
    if (normalized.status >= 500) console.error(normalized.message);
    res.status(normalized.status).json({
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details ? { details: normalized.details } : {}),
        ...(requestId(res) ? { requestId: requestId(res) } : {}),
      },
    });
  });

  void eventsPublisher.publish('service.started', { service: 'operations-api', version: '1.0.0' }).catch(() => undefined);
  return { app, config, prisma };
}
