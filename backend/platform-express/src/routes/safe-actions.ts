import { Router } from "express";
import { z } from "zod";
import type { SafeActionIntent } from "@powerchain/energy-contracts";
import { requireActor } from "../auth/verifier.js";
import { createSafeActionPreview, executeSafeAction } from "../services/safe-actions.js";

export const safeActionsRouter = Router();
safeActionsRouter.use(requireActor);

const previewSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["ems.dispatch", "iot.command", "depin.node_action", "wallet.transfer", "settlement.review"]),
  payload: z.record(z.string(), z.unknown()),
  idempotencyKey: z.string().min(8),
  expectedResourceVersion: z.number().int().nonnegative().optional(),
  requestId: z.string().min(1),
  createdAt: z.string().datetime(),
});

safeActionsRouter.post("/preview", async (request, response) => {
  const body = previewSchema.parse(request.body);
  const intent: SafeActionIntent = {
    ...body,
    organizationId: request.actor!.organizationId,
    actorId: request.actor!.userId,
  };
  response.status(201).json({ data: await createSafeActionPreview(intent) });
});

const executeSchema = z.object({
  actionId: z.string().min(1),
  confirmationToken: z.string().min(16),
  expectedVersion: z.number().int().nonnegative(),
});

safeActionsRouter.post("/execute", async (request, response) => {
  const body = executeSchema.parse(request.body);
  const receipt = await executeSafeAction({
    organizationId: request.actor!.organizationId,
    actorId: request.actor!.userId,
    ...body,
  });
  response.status(receipt.state === "unknown" ? 202 : 200).json({ data: receipt });
});
