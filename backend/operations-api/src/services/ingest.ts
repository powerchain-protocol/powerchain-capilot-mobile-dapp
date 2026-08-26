import { randomUUID } from 'node:crypto';
import {
  assertAlarmIngestRecord,
  assertDepinHeartbeatRecord,
  assertEmsIngestRecord,
  assertIngestEnvelope,
  assertIotHeartbeatRecord,
  type AlarmIngestRecord,
  type DepinHeartbeatRecord,
  type EmsIngestRecord,
  type IngestEnvelope,
  type IngestResult,
  type IotHeartbeatRecord,
} from '@powerchain/operations-contracts';
import type { OperationsPrismaClient } from '../db/prisma.ts';
import { OperationsApiError } from '../errors.ts';
import { sha256Canonical } from '../lib/canonical.ts';

function receiptResult(row: { id: string; recordCount: number; receivedAt: Date }, duplicated: boolean): IngestResult {
  return { accepted: row.recordCount, duplicated, receiptId: row.id, receivedAt: row.receivedAt.toISOString() };
}

async function applyFreshIot(tx: any, row: IotHeartbeatRecord) {
  const observedAt = new Date(row.observedAt);
  const data = { siteId: row.siteId, kind: row.kind, label: row.label, status: row.status, firmware: row.firmware ?? null, lastSeenAt: observedAt, sequence: row.sequence ?? null, source: row.source, mode: row.mode };
  const updated = await tx.iotDevice.updateMany({ where: { id: row.id, OR: [{ lastSeenAt: null }, { lastSeenAt: { lte: observedAt } }] }, data });
  if (updated.count > 0) return true;
  try { await tx.iotDevice.create({ data: { id: row.id, ...data } }); return true; }
  catch {
    const raced = await tx.iotDevice.updateMany({ where: { id: row.id, OR: [{ lastSeenAt: null }, { lastSeenAt: { lte: observedAt } }] }, data });
    return raced.count > 0;
  }
}

async function applyFreshDepin(tx: any, row: DepinHeartbeatRecord) {
  const observedAt = new Date(row.observedAt);
  const data = { siteId: row.siteId ?? null, network: row.network, status: row.status, peerId: row.peerId ?? null, endpoint: row.endpoint ?? null, lastHeartbeatAt: observedAt, sequence: row.sequence ?? null, source: row.source, mode: row.mode };
  const updated = await tx.depinNode.updateMany({ where: { id: row.id, OR: [{ lastHeartbeatAt: null }, { lastHeartbeatAt: { lte: observedAt } }] }, data });
  if (updated.count > 0) return true;
  try { await tx.depinNode.create({ data: { id: row.id, ...data } }); return true; }
  catch {
    const raced = await tx.depinNode.updateMany({ where: { id: row.id, OR: [{ lastHeartbeatAt: null }, { lastHeartbeatAt: { lte: observedAt } }] }, data });
    return raced.count > 0;
  }
}

async function applyFreshAlarm(tx: any, row: AlarmIngestRecord) {
  const observedAt = new Date(row.observedAt);
  const data = {
    siteId: row.siteId, resourceId: row.resourceId ?? null, code: row.code, title: row.title, detail: row.detail ?? null,
    severity: row.severity, state: row.state, source: row.source, mode: row.mode, observedAt, openedAt: new Date(row.openedAt),
    acknowledgedAt: row.acknowledgedAt ? new Date(row.acknowledgedAt) : null, resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : null,
  };
  const updated = await tx.operationalAlarm.updateMany({ where: { id: row.id, observedAt: { lte: observedAt } }, data });
  if (updated.count > 0) return true;
  try { await tx.operationalAlarm.create({ data: { id: row.id, ...data } }); return true; }
  catch {
    const raced = await tx.operationalAlarm.updateMany({ where: { id: row.id, observedAt: { lte: observedAt } }, data });
    return raced.count > 0;
  }
}

export class IngestService {
  constructor(private readonly prisma: OperationsPrismaClient, private readonly maxBatch: number) {}

  async ems(envelope: IngestEnvelope<EmsIngestRecord>) {
    assertIngestEnvelope(envelope, this.maxBatch);
    envelope.records.forEach(assertEmsIngestRecord);
    return this.process('ems', envelope, async (tx, receiptId) => {
      await tx.emsSnapshot.createMany({
        data: envelope.records.map((row) => ({
          siteId: row.siteId,
          source: row.source,
          mode: row.mode,
          status: row.status,
          generationKw: row.generationKw,
          loadKw: row.loadKw,
          storagePowerKw: row.storagePowerKw,
          gridExchangeKw: row.gridExchangeKw,
          batterySocPercent: row.batterySocPercent ?? null,
          frequencyHz: row.frequencyHz ?? null,
          sequence: row.sequence ?? null,
          observedAt: new Date(row.observedAt),
        })),
      });
      await tx.operationalEvent.createMany({
        data: envelope.records.map((row, index) => ({
          id: `${receiptId}:ems:${index}`,
          siteId: row.siteId,
          resourceId: row.siteId,
          kind: 'telemetry',
          type: 'ems.snapshot.ingested',
          summary: 'EMS telemetry snapshot ingested.',
          actorType: 'provider',
          source: row.source,
          mode: row.mode,
          metadata: { sequence: row.sequence ?? null },
          occurredAt: new Date(row.observedAt),
        })),
      });
    });
  }

  async iot(envelope: IngestEnvelope<IotHeartbeatRecord>) {
    assertIngestEnvelope(envelope, this.maxBatch);
    envelope.records.forEach(assertIotHeartbeatRecord);
    return this.process('iot', envelope, async (tx, receiptId) => {
      const applied: boolean[] = [];
      for (const row of envelope.records) applied.push(await applyFreshIot(tx, row));
      await tx.operationalEvent.createMany({
        data: envelope.records.map((row, index) => ({ id: `${receiptId}:iot:${index}`, siteId: row.siteId, resourceId: row.id, kind: 'device', type: applied[index] ? 'iot.heartbeat.ingested' : 'iot.heartbeat.ignored_stale', summary: applied[index] ? `${row.label} heartbeat ingested.` : `${row.label} heartbeat accepted but did not replace newer state.`, actorType: 'provider', source: row.source, mode: row.mode, metadata: { status: row.status, sequence: row.sequence ?? null, applied: applied[index] }, occurredAt: new Date(row.observedAt) })),
      });
    });
  }

  async depin(envelope: IngestEnvelope<DepinHeartbeatRecord>) {
    assertIngestEnvelope(envelope, this.maxBatch);
    envelope.records.forEach(assertDepinHeartbeatRecord);
    return this.process('depin', envelope, async (tx, receiptId) => {
      const applied: boolean[] = [];
      for (const row of envelope.records) applied.push(await applyFreshDepin(tx, row));
      await tx.operationalEvent.createMany({
        data: envelope.records.map((row, index) => ({ id: `${receiptId}:depin:${index}`, siteId: row.siteId ?? null, resourceId: row.id, kind: 'depin', type: applied[index] ? 'depin.heartbeat.ingested' : 'depin.heartbeat.ignored_stale', summary: applied[index] ? `${row.network} node heartbeat ingested.` : `${row.network} node heartbeat accepted but did not replace newer state.`, actorType: 'provider', source: row.source, mode: row.mode, metadata: { status: row.status, sequence: row.sequence ?? null, applied: applied[index] }, occurredAt: new Date(row.observedAt) })),
      });
    });
  }

  async alarms(envelope: IngestEnvelope<AlarmIngestRecord>) {
    assertIngestEnvelope(envelope, this.maxBatch);
    envelope.records.forEach(assertAlarmIngestRecord);
    return this.process('alarms', envelope, async (tx, receiptId) => {
      const applied: boolean[] = [];
      for (const row of envelope.records) applied.push(await applyFreshAlarm(tx, row));
      await tx.operationalEvent.createMany({
        data: envelope.records.map((row, index) => ({ id: `${receiptId}:alarm:${index}`, siteId: row.siteId, resourceId: row.resourceId ?? row.id, kind: 'alarm', type: applied[index] ? `alarm.${row.state}` : 'alarm.update.ignored_stale', summary: applied[index] ? row.title : `${row.title} update accepted but did not replace newer state.`, actorType: 'provider', source: row.source, mode: row.mode, metadata: { code: row.code, severity: row.severity, alarmId: row.id, applied: applied[index] }, occurredAt: new Date(row.observedAt) })),
      });
    });
  }

  private async process<T>(scope: string, envelope: IngestEnvelope<T>, apply: (tx: any, receiptId: string) => Promise<void>) {
    const requestHash = sha256Canonical({ scope, records: envelope.records });
    const existing = await this.prisma.ingestReceipt.findUnique({ where: { scope_idempotencyKey: { scope, idempotencyKey: envelope.idempotencyKey } } });
    if (existing) {
      if (existing.requestHash !== requestHash) throw new OperationsApiError('IDEMPOTENCY_KEY_REUSE', 'The ingest idempotency key was already used for a different payload.', 409);
      return receiptResult(existing, true);
    }

    const receiptId = randomUUID();
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const created = await tx.ingestReceipt.create({ data: { id: receiptId, scope, idempotencyKey: envelope.idempotencyKey, requestHash, recordCount: envelope.records.length } });
        await apply(tx, receiptId);
        return created;
      });
      return receiptResult(row, false);
    } catch (error) {
      const concurrent = await this.prisma.ingestReceipt.findUnique({ where: { scope_idempotencyKey: { scope, idempotencyKey: envelope.idempotencyKey } } });
      if (concurrent) {
        if (concurrent.requestHash !== requestHash) throw new OperationsApiError('IDEMPOTENCY_KEY_REUSE', 'The ingest idempotency key was concurrently used for a different payload.', 409);
        return receiptResult(concurrent, true);
      }
      throw error;
    }
  }
}
