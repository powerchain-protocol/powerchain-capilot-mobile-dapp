import type { TelemetryIngestionInput, TelemetryIngestionReceipt } from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";
import { stableHash } from "../lib/stable-hash.js";
import { operationalError } from "../lib/operational-error.js";
import { assertResourceSite } from "../auth/site-access.js";

function receiptView(row: any): TelemetryIngestionReceipt {
  return {
    receiptId: row.id,
    siteId: row.siteId,
    deviceId: row.deviceId,
    idempotencyKey: row.idempotencyKey,
    source: row.source,
    sourceSequence: String(row.sourceSequence),
    payloadHash: row.payloadHash,
    observedAt: row.observedAt.toISOString(),
    receivedAt: row.receivedAt.toISOString(),
    status: row.status,
    readingId: row.readingId ?? undefined,
    reasonCode: row.reasonCode ?? undefined,
  };
}

export async function ingestTelemetry(
  organizationId: string,
  input: TelemetryIngestionInput,
): Promise<TelemetryIngestionReceipt> {
  await assertResourceSite(organizationId, input.siteId);
  const device = await prisma.iotDevice.findFirst({
    where: { id: input.deviceId, organizationId, siteId: input.siteId },
    select: { id: true },
  });
  if (!device) throw operationalError("DEVICE_NOT_FOUND", 404);

  const observedAt = new Date(input.observedAt);
  if (!Number.isFinite(observedAt.getTime())) throw operationalError("INVALID_OBSERVED_AT", 400);
  if (!/^\d+$/.test(input.sourceSequence)) throw operationalError("INVALID_SOURCE_SEQUENCE", 400);

  const normalized = {
    siteId: input.siteId,
    deviceId: input.deviceId,
    source: input.source,
    sourceSequence: input.sourceSequence,
    idempotencyKey: input.idempotencyKey,
    observedAt: observedAt.toISOString(),
    metric: input.metric,
    value: input.value,
    unit: input.unit,
    quality: input.quality ?? "GOOD",
  };
  const payloadHash = stableHash(normalized);

  const existingKey = await prisma.telemetryIngestionReceipt.findUnique({
    where: {
      organizationId_source_idempotencyKey: {
        organizationId,
        source: input.source,
        idempotencyKey: input.idempotencyKey,
      },
    },
  });
  if (existingKey) {
    if (existingKey.payloadHash !== payloadHash) {
      throw operationalError(
        "TELEMETRY_IDEMPOTENCY_CONFLICT",
        409,
        "The same ingestion key was reused with a different payload.",
      );
    }
    return receiptView(existingKey);
  }

  const latest = await prisma.telemetryIngestionReceipt.findFirst({
    where: { organizationId, deviceId: input.deviceId, source: input.source },
    orderBy: [{ sourceSequence: "desc" }, { receivedAt: "desc" }],
  });
  const currentSequence = latest ? BigInt(String(latest.sourceSequence)) : -1n;
  const incomingSequence = BigInt(input.sourceSequence);
  const isLate = latest != null && (incomingSequence < currentSequence || observedAt < latest.observedAt);
  const receivedAt = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      const reading = await tx.telemetryReading.create({
        data: {
          organizationId,
          deviceId: input.deviceId,
          metric: input.metric,
          value: input.value,
          unit: input.unit,
          quality: input.quality ?? "GOOD",
          source: input.source,
          sourceSequence: input.sourceSequence,
          payloadHash,
          idempotencyKey: input.idempotencyKey,
          isLate,
          observedAt,
          receivedAt,
        },
      });
      const receipt = await tx.telemetryIngestionReceipt.create({
        data: {
          organizationId,
          siteId: input.siteId,
          deviceId: input.deviceId,
          source: input.source,
          sourceSequence: input.sourceSequence,
          idempotencyKey: input.idempotencyKey,
          payloadHash,
          observedAt,
          receivedAt,
          status: isLate ? "late" : "accepted",
          readingId: reading.id,
          reasonCode: isLate ? "OLDER_THAN_SOURCE_WATERMARK" : null,
        },
      });
      await tx.operationalEventJournal.create({
        data: {
          organizationId,
          siteId: input.siteId,
          eventType: isLate ? "telemetry.late" : "telemetry.accepted",
          aggregateType: "IotDevice",
          aggregateId: input.deviceId,
          severity: isLate ? "warning" : "info",
          source: input.source,
          sourceSequence: input.sourceSequence,
          payload: normalized,
          payloadHash,
          observedAt,
          receivedAt,
          requestId: input.idempotencyKey,
          traceId: input.idempotencyKey,
        },
      });
      if (!isLate) {
        await tx.iotDevice.update({
          where: { id: input.deviceId },
          data: { lastSeenAt: observedAt, connectivity: "ONLINE" },
        });
      }
      return receiptView(receipt);
    });
  } catch (error: any) {
    // Source-sequence duplicates are idempotent only when the canonical payload matches.
    const sameSequence = await prisma.telemetryIngestionReceipt.findFirst({
      where: {
        organizationId,
        deviceId: input.deviceId,
        source: input.source,
        sourceSequence: input.sourceSequence,
      },
    });
    if (sameSequence) {
      if (sameSequence.payloadHash !== payloadHash) {
        throw operationalError("TELEMETRY_SEQUENCE_CONFLICT", 409, "The same source sequence was received with different content.");
      }
      return receiptView(sameSequence);
    }
    throw error;
  }
}
