import type { OperationalAlarm } from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";
import { stableHash } from "../lib/stable-hash.js";
import { operationalError } from "../lib/operational-error.js";
import { appendOperationalEvent } from "./events.js";

export interface AlarmObservationInput {
  siteId: string;
  alarmId: string;
  sourceType: "ems" | "iot" | "depin" | "grid" | "system";
  sourceId?: string;
  source: string;
  sourceSequence?: string;
  code: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  status: "open" | "acknowledged" | "resolved";
  observedAt: string;
}

export function alarmView(row: any): OperationalAlarm {
  return {
    id: row.id,
    organizationId: row.organizationId,
    siteId: row.siteId,
    sourceType: row.sourceType,
    sourceId: row.sourceId ?? undefined,
    code: row.code,
    title: row.title,
    message: row.message,
    severity: row.severity,
    status: row.status,
    observedAt: row.observedAt.toISOString(),
    receivedAt: row.receivedAt.toISOString(),
    payloadHash: row.payloadHash,
    acknowledgedAt: row.acknowledgedAt?.toISOString(),
    acknowledgedBy: row.acknowledgedBy ?? undefined,
    resolvedAt: row.resolvedAt?.toISOString(),
    resolvedBy: row.resolvedBy ?? undefined,
  };
}

export async function ingestAlarmObservation(
  organizationId: string,
  input: AlarmObservationInput,
  requestId: string,
  traceId: string,
) {
  const observedAt = new Date(input.observedAt);
  if (!Number.isFinite(observedAt.getTime())) throw operationalError("INVALID_OBSERVED_AT", 400);
  const receivedAt = new Date();
  const payloadHash = stableHash(input);
  const existing = await prisma.operationalAlarm.findFirst({
    where: { id: input.alarmId, organizationId, siteId: input.siteId },
  });
  const late = existing != null && observedAt < existing.observedAt;

  await appendOperationalEvent({
    organizationId,
    siteId: input.siteId,
    eventType: late ? "alarm.observation_late" : `alarm.${input.status}`,
    aggregateType: "OperationalAlarm",
    aggregateId: input.alarmId,
    severity: input.severity,
    source: input.source,
    sourceSequence: input.sourceSequence,
    payload: { ...input, payloadHash, late },
    observedAt,
    receivedAt,
    requestId,
    traceId,
  });

  if (late) return { alarm: existing, late: true };
  const alarm = await prisma.operationalAlarm.upsert({
    where: { id: input.alarmId },
    create: {
      id: input.alarmId,
      organizationId,
      siteId: input.siteId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      code: input.code,
      title: input.title,
      message: input.message,
      severity: input.severity,
      status: input.status,
      observedAt,
      receivedAt,
      sourceSequence: input.sourceSequence,
      payloadHash,
      acknowledgedAt: input.status === "acknowledged" ? observedAt : undefined,
      resolvedAt: input.status === "resolved" ? observedAt : undefined,
    },
    update: {
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      code: input.code,
      title: input.title,
      message: input.message,
      severity: input.severity,
      status: input.status,
      observedAt,
      receivedAt,
      sourceSequence: input.sourceSequence,
      payloadHash,
      ...(input.status === "acknowledged" ? { acknowledgedAt: observedAt } : {}),
      ...(input.status === "resolved" ? { resolvedAt: observedAt } : {}),
    },
  });
  return { alarm, late: false };
}
