import type { OperationalJournalEvent } from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";
import { stableHash } from "../lib/stable-hash.js";

export async function appendOperationalEvent(input: {
  organizationId: string;
  siteId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  severity?: "info" | "warning" | "critical";
  source: string;
  sourceSequence?: string;
  payload: Record<string, unknown>;
  observedAt: Date;
  receivedAt?: Date;
  requestId: string;
  traceId: string;
}) {
  const payloadHash = stableHash(input.payload);
  return prisma.operationalEventJournal.create({
    data: {
      ...input,
      severity: input.severity ?? "info",
      sourceSequence: input.sourceSequence,
      payloadHash,
      receivedAt: input.receivedAt ?? new Date(),
    },
  });
}

export function eventView(row: any): OperationalJournalEvent {
  return {
    id: row.id,
    organizationId: row.organizationId,
    siteId: row.siteId,
    eventType: row.eventType,
    aggregateType: row.aggregateType,
    aggregateId: row.aggregateId,
    severity: row.severity,
    source: row.source,
    sourceSequence: row.sourceSequence == null ? undefined : String(row.sourceSequence),
    payloadHash: row.payloadHash,
    payload: row.payload as Record<string, unknown>,
    observedAt: row.observedAt.toISOString(),
    receivedAt: row.receivedAt.toISOString(),
    requestId: row.requestId,
    traceId: row.traceId,
  };
}
