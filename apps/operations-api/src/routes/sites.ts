import { Router } from "express";
import { requireActor } from "../auth/adapter.js";
import { listAccessibleSites } from "../services/sites.js";
export const sitesRouter=Router(); sitesRouter.use(requireActor);
sitesRouter.get("/",async(request,response)=>response.json({data:await listAccessibleSites(request.actor!.organizationId,request.actor!.userId),meta:{requestId:request.requestId,traceId:request.traceId,schemaVersion:"1.0.0"}}));
