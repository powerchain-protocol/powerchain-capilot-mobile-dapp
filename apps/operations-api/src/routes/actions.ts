import { Router } from "express";
import { z } from "zod";
import type { SafeActionIntent } from "@powerchain/energy-contracts";
import { requireActor } from "../auth/adapter.js";
import { requireSiteAccess } from "../auth/site-access.js";
import { prepareSafeAction } from "../services/safe-actions.js";
import { requireWalletOwnership } from "../wallet/ownership.js";
import { prisma } from "../db/prisma.js";
import { prepareDispatchSimulation } from "../services/dispatch-state.js";

export const actionsRouter = Router();
actionsRouter.use(requireActor);

const common = {
  id: z.string().min(1),
  idempotencyKey: z.string().min(8).max(200),
  expectedResourceVersion: z.number().int().nonnegative().optional(),
  requestId: z.string().min(1),
  traceId: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
};
const decimal = z.string().regex(/^-?\d+(?:\.\d+)?$/);
const baseUnits = z.string().regex(/^\d+$/);

const schema = z.discriminatedUnion("type", [
  z.object({ ...common, type:z.literal("ems.dispatch.prepare"), siteId:z.string().min(1), payload:z.object({assetId:z.string().min(1),targetPowerMw:decimal,durationMinutes:z.number().int().positive().max(1440),mode:z.enum(["charge","discharge","curtail","generate"]),reason:z.string().min(3).max(500)}) }),
  z.object({ ...common, type:z.literal("iot.device.refresh"), siteId:z.string().min(1), payload:z.object({deviceId:z.string().min(1)}) }),
  z.object({ ...common, type:z.literal("depin.node.refresh"), siteId:z.string().min(1), payload:z.object({nodeId:z.string().min(1)}) }),
  z.object({ ...common, type:z.literal("alarm.acknowledge.prepare"), siteId:z.string().min(1), payload:z.object({alarmId:z.string().min(1),reason:z.string().min(3).max(500)}) }),
  z.object({ ...common, type:z.literal("wallet.signature.prepare"), siteId:z.string().min(1).optional(), payload:z.object({chain:z.enum(["solana","sui"]),address:z.string().min(16).max(128),messageDigest:z.string().regex(/^[0-9a-fA-F]{64}$/),purpose:z.string().min(3).max(200)}) }),
  z.object({ ...common, type:z.literal("settlement.prepare"), siteId:z.string().min(1).optional(), payload:z.object({settlementId:z.string().min(1),chain:z.enum(["solana","sui"]),asset:z.string().min(1).max(32),amountBaseUnits:baseUnits,sourceWalletAddress:z.string().min(16).max(128),recipient:z.string().min(16).max(128),reason:z.string().min(3).max(500)}) }),
]);

actionsRouter.post("/prepare", async (request, response) => {
  const body = schema.parse(request.body);
  const permission = body.type === "ems.dispatch.prepare" ? "ems.dispatch.prepare"
    : body.type === "iot.device.refresh" ? "iot.read"
    : body.type === "depin.node.refresh" ? "depin.read"
    : body.type === "alarm.acknowledge.prepare" ? "alarms.acknowledge.prepare"
    : body.type === "settlement.prepare" ? "settlement.prepare"
    : "wallet.signature.prepare";
  if (body.siteId) await requireSiteAccess(request.actor!, body.siteId, permission);

  if(body.type==="alarm.acknowledge.prepare"){
    const alarm=await prisma.operationalAlarm.findFirst({where:{id:body.payload.alarmId,organizationId:request.actor!.organizationId,siteId:body.siteId}});
    if(!alarm) return response.status(404).json({error:"ALARM_NOT_FOUND",requestId:request.requestId});
  }
  if(body.type==="wallet.signature.prepare") await requireWalletOwnership(request.actor!,body.payload.chain,body.payload.address,body.siteId);
  if(body.type==="settlement.prepare") await requireWalletOwnership(request.actor!,body.payload.chain,body.payload.sourceWalletAddress,body.siteId);

  const intent: SafeActionIntent = { ...body, organizationId:request.actor!.organizationId, actorId:request.actor!.userId, traceId:body.traceId ?? request.traceId };
  const preview=await prepareSafeAction(intent);
  const dispatchSimulation=body.type==="ems.dispatch.prepare" ? prepareDispatchSimulation({siteId:body.siteId,assetId:body.payload.assetId,targetPowerMw:body.payload.targetPowerMw,durationMinutes:body.payload.durationMinutes,mode:body.payload.mode,reason:body.payload.reason,expectedResourceVersion:body.expectedResourceVersion}) : undefined;
  response.status(201).json({data:{...preview,dispatchSimulation},meta:{requestId:request.requestId,traceId:request.traceId,schemaVersion:"1.0.0",physicalExecution:false}});
});
