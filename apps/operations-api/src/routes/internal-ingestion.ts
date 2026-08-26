import { Router } from "express";
import { z } from "zod";
import { requireInternalIngestion } from "../auth/internal-ingestion.js";
import { ingestTelemetry } from "../services/telemetry-integrity.js";
import { ingestAlarmObservation } from "../services/alarms.js";
import { prisma } from "../db/prisma.js";
import { stableHash } from "../lib/stable-hash.js";

export const internalIngestionRouter=Router();
internalIngestionRouter.use(requireInternalIngestion);
const telemetry=z.object({organizationId:z.string().min(1),siteId:z.string().min(1),deviceId:z.string().min(1),source:z.string().min(1).max(100),sourceSequence:z.string().regex(/^\d+$/),idempotencyKey:z.string().min(8).max(200),observedAt:z.string().datetime(),metric:z.string().min(1).max(100),value:z.string().regex(/^-?\d+(?:\.\d+)?$/),unit:z.string().min(1).max(32),quality:z.enum(["GOOD","DEGRADED","BAD","UNKNOWN"]).optional()});
internalIngestionRouter.post("/telemetry",async(request,response)=>{const input=telemetry.parse(request.body);const data=await ingestTelemetry(input.organizationId,input);response.status(data.status==="accepted"||data.status==="late"?201:200).json({data,meta:{requestId:request.requestId,traceId:request.traceId}});});

const alarm=z.object({organizationId:z.string().min(1),siteId:z.string().min(1),alarmId:z.string().min(1),sourceType:z.enum(["ems","iot","depin","grid","system"]),sourceId:z.string().optional(),source:z.string().min(1),sourceSequence:z.string().regex(/^\d+$/).optional(),code:z.string().min(1),title:z.string().min(1).max(200),message:z.string().min(1).max(2000),severity:z.enum(["info","warning","critical"]),status:z.enum(["open","acknowledged","resolved"]),observedAt:z.string().datetime()});
internalIngestionRouter.post("/alarm",async(request,response)=>{const input=alarm.parse(request.body);const data=await ingestAlarmObservation(input.organizationId,input,request.requestId!,request.traceId!);response.status(201).json({data:{alarmId:data.alarm.id,late:data.late},meta:{requestId:request.requestId,traceId:request.traceId}});});

const depin=z.object({organizationId:z.string().min(1),siteId:z.string().min(1),nodeId:z.string().min(1),status:z.string().min(1),observedAt:z.string().datetime(),sourceSequence:z.string().regex(/^\d+$/),payload:z.record(z.string(),z.unknown()).default({})});
internalIngestionRouter.post("/depin",async(request,response)=>{const input=depin.parse(request.body);const observedAt=new Date(input.observedAt);const row=await prisma.depinNode.findFirst({where:{id:input.nodeId,organizationId:input.organizationId,siteId:input.siteId}});if(!row)return response.status(404).json({error:"DEPIN_NODE_NOT_FOUND"});const latest=row.lastHeartbeatAt;const late=latest!=null&&observedAt<latest;const hash=stableHash(input);await prisma.operationalEventJournal.create({data:{organizationId:input.organizationId,siteId:input.siteId,eventType:late?"depin.heartbeat_late":"depin.heartbeat",aggregateType:"DepinNode",aggregateId:input.nodeId,severity:late?"warning":"info",source:"depin",sourceSequence:input.sourceSequence,payload:input as any,payloadHash:hash,observedAt,receivedAt:new Date(),requestId:request.requestId!,traceId:request.traceId!}});if(!late)await prisma.depinNode.update({where:{id:input.nodeId},data:{status:input.status,lastHeartbeatAt:observedAt}});response.status(201).json({data:{nodeId:input.nodeId,late,payloadHash:hash}});});
