import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuthPrincipal, SafeActionDecision, SafeActionRequest } from '@powerchain/operations-contracts';
import { OperationsApiError } from '../errors.ts';
import { SafeActionService, safeActionRequestHash, type SafeActionStore, type StoredSafeAction } from '../actions/safe-action.ts';
import { EmsService } from './ems.ts';
import { IotService } from './iot.ts';
import { TwinService } from './twin.ts';
import { IngestService } from './ingest.ts';

class MemoryActionStore implements SafeActionStore {
  private readonly rows = new Map<string, StoredSafeAction>();
  async findByIdempotencyKey(userId: string, key: string) { return this.rows.get(`${userId}:${key}`) ?? null; }
  async create(input: { principal: AuthPrincipal; request: SafeActionRequest; decision: SafeActionDecision; requestHash: string }) {
    const value = { decision: input.decision, requestHash: input.requestHash };
    const key = `${input.principal.userId}:${input.request.idempotencyKey}`;
    const existing = this.rows.get(key);
    if (existing) return existing;
    this.rows.set(key, value);
    return value;
  }
}

test('EMS service preserves decimal strings, sequence and freshness metadata', async () => {
  const now = new Date();
  const service = new EmsService({
    async latestSnapshot(siteId) {
      return {
        siteId,
        source: 'meter-gateway',
        mode: 'live',
        status: 'operational',
        generationKw: { toString: () => '1250.500000' },
        loadKw: { toString: () => '980.250000' },
        storagePowerKw: { toString: () => '-100.000000' },
        gridExchangeKw: { toString: () => '-170.250000' },
        batterySocPercent: { toString: () => '71.2500' },
        frequencyHz: { toString: () => '50.0200' },
        observedAt: now,
        receivedAt: now,
        sequence: 'gw-001:9981',
      };
    },
  }, 120, 'unavailable');
  const result = await service.getOverview('site-1');
  assert.equal(result?.generation.value, '1250.500000');
  assert.equal(result?.source.freshness, 'fresh');
  assert.equal(result?.source.mode, 'live');
  assert.equal(result?.source.sequence, 'gw-001:9981');
});

test('IoT pagination returns a bounded page and deterministic cursor', async () => {
  const now = new Date();
  const service = new IotService({
    async listDevices({ siteId, take }) {
      return ['a', 'b', 'c'].slice(0, take).map((id) => ({ id, siteId, kind: 'meter', label: `Meter ${id}`, status: 'operational', firmware: null, lastSeenAt: now, source: 'gateway', mode: 'live', updatedAt: now }));
    },
  }, 300, 'live');
  const result = await service.listDevices('site-1', { limit: 2 });
  assert.deepEqual(result.items.map((item) => item.id), ['a', 'b']);
  assert.equal(result.page.hasMore, true);
  assert.equal(result.page.nextCursor, 'b');
});

test('safe action service prepares but never executes state-changing work', async () => {
  const service = new SafeActionService(new MemoryActionStore(), 600);
  const request: SafeActionRequest = {
    action: 'ems.dispatch.prepare',
    resourceId: 'site-1',
    reason: 'Review battery dispatch for the evening peak.',
    idempotencyKey: 'dispatch:site-1:12345678',
    parameters: { requestedKw: '250.000000' },
  };
  const first = await service.prepare({ userId: 'user-1', roles: [] }, request);
  const second = await service.prepare({ userId: 'user-1', roles: [] }, request);
  assert.equal(first.requestId, second.requestId);
  assert.equal(first.risk, 'review_required');
  assert.equal(first.requiresHumanApproval, true);
  assert.equal(first.requiresWalletSignature, false);
  assert.deepEqual(first.simulation, { status: 'required_before_execution' });
});

test('safe action idempotency key is cryptographically bound to the request', async () => {
  const service = new SafeActionService(new MemoryActionStore(), 600);
  const base: SafeActionRequest = { action: 'iot.device.refresh', resourceId: 'meter-1', reason: 'Refresh device status.', idempotencyKey: 'refresh:meter-1:12345678' };
  await service.prepare({ userId: 'user-1', roles: [] }, base);
  await assert.rejects(() => service.prepare({ userId: 'user-1', roles: [] }, { ...base, resourceId: 'meter-2' }), (error: unknown) => {
    assert.equal(error instanceof OperationsApiError && error.code, 'IDEMPOTENCY_KEY_REUSE');
    return true;
  });
  assert.equal(safeActionRequestHash(base).length, 64);
});

test('digital twin degrades when operational assets are unhealthy and surfaces alarm counts', async () => {
  const now = new Date();
  const ems = new EmsService({
    async latestSnapshot(siteId) {
      return { siteId, source: 'ems', mode: 'live', status: 'operational', generationKw: { toString: () => '10' }, loadKw: { toString: () => '9' }, storagePowerKw: { toString: () => '0' }, gridExchangeKw: { toString: () => '-1' }, batterySocPercent: null, frequencyHz: { toString: () => '50.00' }, observedAt: now, receivedAt: now };
    },
  }, 120, 'live');
  const twin = new TwinService(ems, { async counts() { return { iotTotal: 2, iotOperational: 1, depinTotal: 1, depinOperational: 1, alarmsOpen: 2, alarmsCritical: 0 }; } });
  const result = await twin.get('site-1');
  assert.equal(result.status, 'degraded');
  assert.equal(result.assets.iotTotal, 2);
  assert.equal(result.alarms.open, 2);
});

test('telemetry integrity is evidence-derived and degrades on critical alarms', async () => {
  const now = new Date();
  const ems = new EmsService({
    async latestSnapshot(siteId) {
      return { siteId, source: 'ems', mode: 'live', status: 'operational', generationKw: { toString: () => '10' }, loadKw: { toString: () => '9' }, storagePowerKw: { toString: () => '0' }, gridExchangeKw: { toString: () => '-1' }, batterySocPercent: null, frequencyHz: { toString: () => '50.00' }, observedAt: now, receivedAt: now };
    },
  }, 120, 'live');
  const twin = new TwinService(ems, { async counts() { return { iotTotal: 4, iotOperational: 4, depinTotal: 2, depinOperational: 2, alarmsOpen: 1, alarmsCritical: 1 }; } });
  const integrity = await twin.integrity('site-1');
  assert.equal(integrity.state, 'degraded');
  assert.equal(integrity.freshness, 'fresh');
  assert.equal(integrity.checks.find((check) => check.name === 'critical_alarms')?.status, 'failed');
  assert.equal(integrity.observedAt, now.toISOString());
});


function fakeIngestPrisma() {
  const receipts = new Map<string, { id: string; scope: string; idempotencyKey: string; requestHash: string; recordCount: number; receivedAt: Date }>();
  const tx: any = {
    ingestReceipt: {
      async create({ data }: any) {
        const key = `${data.scope}:${data.idempotencyKey}`;
        if (receipts.has(key)) throw new Error('unique');
        const row = { ...data, receivedAt: new Date() };
        receipts.set(key, row);
        return row;
      },
    },
    emsSnapshot: { async createMany() { return { count: 1 }; } },
    iotDevice: { async upsert() { return {}; } },
    depinNode: { async upsert() { return {}; } },
    operationalAlarm: { async upsert() { return {}; } },
    operationalEvent: { async createMany() { return { count: 1 }; } },
  };
  return {
    ingestReceipt: {
      async findUnique({ where }: any) { return receipts.get(`${where.scope_idempotencyKey.scope}:${where.scope_idempotencyKey.idempotencyKey}`) ?? null; },
    },
    async $transaction(run: any) { return run(tx); },
  } as any;
}

test('ingest service returns the original receipt for an identical idempotent replay', async () => {
  const service = new IngestService(fakeIngestPrisma(), 100);
  const body = {
    idempotencyKey: 'ems:site-1:12345678',
    records: [{ siteId: 'site-1', source: 'gateway', mode: 'live' as const, status: 'operational' as const, generationKw: '1.000000', loadKw: '1.000000', storagePowerKw: '0.000000', gridExchangeKw: '0.000000', observedAt: new Date().toISOString() }],
  };
  const first = await service.ems(body);
  const replay = await service.ems(body);
  assert.equal(first.duplicated, false);
  assert.equal(replay.duplicated, true);
  assert.equal(replay.receiptId, first.receiptId);
});

test('ingest service rejects same idempotency key with a different canonical payload', async () => {
  const service = new IngestService(fakeIngestPrisma(), 100);
  const observedAt = new Date().toISOString();
  const first = { idempotencyKey: 'ems:site-1:abcdefgh', records: [{ siteId: 'site-1', source: 'gateway', mode: 'live' as const, status: 'operational' as const, generationKw: '1.000000', loadKw: '1.000000', storagePowerKw: '0.000000', gridExchangeKw: '0.000000', observedAt }] };
  await service.ems(first);
  await assert.rejects(() => service.ems({ ...first, records: [{ ...first.records[0], generationKw: '2.000000' }] }), (error: unknown) => {
    assert.equal(error instanceof OperationsApiError && error.code, 'IDEMPOTENCY_KEY_REUSE');
    return true;
  });
});

function fakeFreshnessIngestPrisma() {
  const receipts = new Map<string, any>();
  const devices = new Map<string, any>();
  const events: any[] = [];
  const tx: any = {
    ingestReceipt: {
      async create({ data }: any) {
        const key = `${data.scope}:${data.idempotencyKey}`;
        if (receipts.has(key)) throw new Error('unique');
        const row = { ...data, receivedAt: new Date() };
        receipts.set(key, row);
        return row;
      },
    },
    iotDevice: {
      async updateMany({ where, data }: any) {
        const current = devices.get(where.id);
        if (!current) return { count: 0 };
        if (current.lastSeenAt && current.lastSeenAt.getTime() > data.lastSeenAt.getTime()) return { count: 0 };
        devices.set(where.id, { ...current, ...data, id: where.id });
        return { count: 1 };
      },
      async create({ data }: any) {
        if (devices.has(data.id)) throw new Error('unique');
        devices.set(data.id, { ...data });
        return data;
      },
    },
    operationalEvent: {
      async createMany({ data }: any) { events.push(...data); return { count: data.length }; },
    },
  };
  return {
    ingestReceipt: {
      async findUnique({ where }: any) { return receipts.get(`${where.scope_idempotencyKey.scope}:${where.scope_idempotencyKey.idempotencyKey}`) ?? null; },
    },
    async $transaction(run: any) { return run(tx); },
    __state: { devices, events },
  } as any;
}

test('out-of-order IoT heartbeat is audited but cannot replace newer device state', async () => {
  const prisma = fakeFreshnessIngestPrisma();
  const service = new IngestService(prisma, 100);
  const newerAt = new Date(Date.now() - 60_000).toISOString();
  const olderAt = new Date(Date.now() - 120_000).toISOString();

  await service.iot({
    idempotencyKey: 'iot:meter-1:newer:12345678',
    records: [{ id: 'meter-1', siteId: 'site-1', kind: 'meter', label: 'Revenue Meter', status: 'operational', source: 'gateway', mode: 'live', sequence: '102', observedAt: newerAt }],
  });
  await service.iot({
    idempotencyKey: 'iot:meter-1:older:12345678',
    records: [{ id: 'meter-1', siteId: 'site-1', kind: 'meter', label: 'Revenue Meter', status: 'offline', source: 'gateway', mode: 'live', sequence: '101', observedAt: olderAt }],
  });

  const device = prisma.__state.devices.get('meter-1');
  assert.equal(device.status, 'operational');
  assert.equal(device.sequence, '102');
  assert.equal(device.lastSeenAt.toISOString(), newerAt);
  assert.equal(prisma.__state.events.at(-1).type, 'iot.heartbeat.ignored_stale');
  assert.equal(prisma.__state.events.at(-1).metadata.applied, false);
});
