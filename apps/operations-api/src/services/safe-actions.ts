import type { SafeActionIntent, SafeActionPreview, SafeActionState, SafeActionType } from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";
import { config } from "../config.js";
import { evaluateSafeActionPolicy } from "../policy/safe-action-policy.js";
import { stableHash } from "../lib/stable-hash.js";


export async function prepareSafeAction(intent: SafeActionIntent): Promise<SafeActionPreview> {
  const payload = intent.payload as Record<string, unknown>;
  const resource = String(payload.assetId ?? payload.deviceId ?? payload.nodeId ?? payload.alarmId ?? payload.settlementId ?? payload.address ?? intent.siteId ?? "organization");
  const reason = String(payload.reason ?? payload.purpose ?? payload.note ?? "");
  const intentHash = stableHash({ action:intent.type, resource, reason, parameters:payload, organizationId:intent.organizationId, actorId:intent.actorId, siteId:intent.siteId, idempotencyKey:intent.idempotencyKey, expectedResourceVersion:intent.expectedResourceVersion });
  const existing = await prisma.safeAction.findUnique({ where: { organizationId_idempotencyKey: { organizationId:intent.organizationId, idempotencyKey:intent.idempotencyKey } } });
  if (existing) {
    if (existing.intentHash !== intentHash) throw Object.assign(new Error("ACTION_IDEMPOTENCY_CONFLICT"), { statusCode:409 });
    return { previewId:existing.id, intentId:existing.id, type:existing.type as SafeActionType, state:existing.state.toLowerCase() as SafeActionState,
      summary:existing.summary as Record<string,unknown>, policyReasons:existing.policyReasons as string[], confirmationRequired:evaluateSafeActionPolicy(existing.type as SafeActionType).confirmationRequired,
      walletSignatureRequired:evaluateSafeActionPolicy(existing.type as SafeActionType).walletSignatureRequired, readOnly:evaluateSafeActionPolicy(existing.type as SafeActionType).readOnly, intentHash:existing.intentHash, expiresAt:existing.expiresAt.toISOString() };
  }
  const p = evaluateSafeActionPolicy(intent.type);
  const expiresAt = new Date(Date.now()+config.SAFE_ACTION_TTL_SECONDS*1000);
  const eventId = crypto.randomUUID();
  const occurredAt = new Date();
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.safeAction.create({ data: { id:intent.id, organizationId:intent.organizationId, actorId:intent.actorId, siteId:intent.siteId,
      type:intent.type, payload:intent.payload as object, summary:{type:intent.type,siteId:intent.siteId,payload:intent.payload}, state:p.state.toUpperCase(),
      policyReasons:p.reasons, idempotencyKey:intent.idempotencyKey, intentHash, requestId:intent.requestId, traceId:intent.traceId ?? intent.requestId,
      expectedResourceVersion:intent.expectedResourceVersion, expiresAt } });
    await tx.operationalOutbox.create({ data: { id:eventId, organizationId:intent.organizationId, siteId:intent.siteId, aggregateType:"SafeAction", aggregateId:created.id,
      aggregateVersion:created.resourceVersion, eventType:"operations.safe_action.prepared", schemaVersion:"1.0.0", payload:{type:intent.type,state:p.state,intentHash},
      requestId:intent.requestId, traceId:intent.traceId ?? intent.requestId, occurredAt } });
    return created;
  });
  return { previewId:row.id, intentId:row.id, type:intent.type, state:p.state, summary:row.summary as Record<string,unknown>, policyReasons:p.reasons,
    confirmationRequired:p.confirmationRequired, walletSignatureRequired:p.walletSignatureRequired, readOnly:p.readOnly, intentHash, expiresAt:expiresAt.toISOString() };
}
