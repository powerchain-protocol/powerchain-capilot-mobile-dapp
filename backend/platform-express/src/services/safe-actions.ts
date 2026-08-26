import { createHash, randomBytes } from "node:crypto";
import type {
  SafeActionIntent,
  SafeActionPreview,
  SafeActionReceipt,
} from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";
import { config } from "../config.js";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

function controlPlaneFor(type: string): { url?: string; secret?: string } {
  if (type === "ems.dispatch") return { url: config.EMS_CONTROL_PLANE_URL || undefined, secret: config.EMS_CONTROL_PLANE_SECRET || undefined };
  if (type === "iot.command") return { url: config.IOT_CONTROL_PLANE_URL || undefined, secret: config.IOT_CONTROL_PLANE_SECRET || undefined };
  if (type === "depin.node_action") return { url: config.DEPIN_CONTROL_PLANE_URL || undefined, secret: config.DEPIN_CONTROL_PLANE_SECRET || undefined };
  return {};
}

export async function createSafeActionPreview(
  intent: SafeActionIntent,
): Promise<SafeActionPreview> {
  const existing = await prisma.safeAction.findUnique({
    where: {
      organizationId_idempotencyKey: {
        organizationId: intent.organizationId,
        idempotencyKey: intent.idempotencyKey,
      },
    },
  });
  if (existing) {
    return {
      previewId: existing.id,
      intentId: existing.id,
      state: existing.state === "REJECTED" ? "rejected" : "review_required",
      summary: existing.summary as Record<string, unknown>,
      policyReasons: existing.policyReasons as string[],
      confirmationRequired: true,
      expiresAt: existing.confirmationExpiresAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.ACTION_CONFIRMATION_TTL_SECONDS * 1000);
  const policyReasons = ["HUMAN_CONFIRMATION_REQUIRED"];
  if (!config.ACTION_EXECUTION_ENABLED) policyReasons.push("EXTERNAL_EXECUTION_DISABLED");
  if (!controlPlaneFor(intent.type).url) policyReasons.push("CONTROL_PLANE_NOT_CONFIGURED");

  const row = await prisma.safeAction.create({
    data: {
      id: intent.id,
      organizationId: intent.organizationId,
      actorId: intent.actorId,
      type: intent.type,
      payload: intent.payload as object,
      summary: {
        type: intent.type,
        payload: intent.payload,
      },
      state: "REVIEW_REQUIRED",
      policyReasons,
      idempotencyKey: intent.idempotencyKey,
      requestId: intent.requestId,
      expectedResourceVersion: intent.expectedResourceVersion,
      confirmationTokenHash: hash(token),
      confirmationExpiresAt: expiresAt,
    },
  });

  return {
    previewId: row.id,
    intentId: row.id,
    state: "review_required",
    summary: row.summary as Record<string, unknown>,
    policyReasons,
    confirmationRequired: true,
    confirmationToken: token,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function executeSafeAction(input: {
  organizationId: string;
  actorId: string;
  actionId: string;
  confirmationToken: string;
  expectedVersion: number;
}): Promise<SafeActionReceipt> {
  if (!config.ACTION_EXECUTION_ENABLED) {
    const error = new Error("ACTION_EXECUTION_DISABLED");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  const row = await prisma.safeAction.findFirst({
    where: { id: input.actionId, organizationId: input.organizationId },
  });
  if (!row) throw Object.assign(new Error("ACTION_NOT_FOUND"), { statusCode: 404 });
  if (row.actorId !== input.actorId) throw Object.assign(new Error("ACTION_ACTOR_MISMATCH"), { statusCode: 403 });
  if (row.resourceVersion !== input.expectedVersion) throw Object.assign(new Error("ACTION_VERSION_CONFLICT"), { statusCode: 409 });
  if (row.state !== "REVIEW_REQUIRED") throw Object.assign(new Error("ACTION_STATE_INVALID"), { statusCode: 409 });
  if (!row.confirmationExpiresAt || row.confirmationExpiresAt.getTime() <= Date.now()) {
    throw Object.assign(new Error("ACTION_CONFIRMATION_EXPIRED"), { statusCode: 409 });
  }
  if (!row.confirmationTokenHash || hash(input.confirmationToken) !== row.confirmationTokenHash) {
    throw Object.assign(new Error("ACTION_CONFIRMATION_INVALID"), { statusCode: 403 });
  }

  const control = controlPlaneFor(row.type);
  if (!control.url || !control.secret) {
    throw Object.assign(new Error("ACTION_CONTROL_PLANE_UNAVAILABLE"), { statusCode: 503 });
  }

  const claimed = await prisma.safeAction.updateMany({
    where: {
      id: row.id,
      organizationId: input.organizationId,
      resourceVersion: input.expectedVersion,
      state: "REVIEW_REQUIRED",
    },
    data: {
      state: "EXECUTING",
      resourceVersion: { increment: 1 },
      confirmationTokenHash: null,
    },
  });
  if (claimed.count !== 1) throw Object.assign(new Error("ACTION_CONCURRENT_MODIFICATION"), { statusCode: 409 });

  try {
    const response = await fetch(`${control.url.replace(/\/$/, "")}/v1/actions/execute`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${control.secret}`,
        "idempotency-key": row.idempotencyKey,
      },
      body: JSON.stringify({
        actionId: row.id,
        type: row.type,
        payload: row.payload,
        organizationId: row.organizationId,
        actorId: row.actorId,
      }),
    });
    if (!response.ok) {
      await prisma.safeAction.update({
        where: { id: row.id },
        data: { state: "UNKNOWN", errorCode: `CONTROL_PLANE_HTTP_${response.status}` },
      });
      return {
        actionId: row.id,
        intentId: row.id,
        state: "unknown",
        errorCode: `CONTROL_PLANE_HTTP_${response.status}`,
        updatedAt: new Date().toISOString(),
      };
    }
    const body = (await response.json()) as { externalReference?: string };
    await prisma.safeAction.update({
      where: { id: row.id },
      data: {
        state: "COMPLETED",
        externalReference: body.externalReference,
      },
    });
    return {
      actionId: row.id,
      intentId: row.id,
      state: "completed",
      externalReference: body.externalReference,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    await prisma.safeAction.update({
      where: { id: row.id },
      data: { state: "UNKNOWN", errorCode: "CONTROL_PLANE_TRANSPORT_UNKNOWN" },
    });
    return {
      actionId: row.id,
      intentId: row.id,
      state: "unknown",
      errorCode: "CONTROL_PLANE_TRANSPORT_UNKNOWN",
      updatedAt: new Date().toISOString(),
    };
  }
}
