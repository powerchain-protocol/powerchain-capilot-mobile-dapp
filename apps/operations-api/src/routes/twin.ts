import { Router } from "express";
import { z } from "zod";
import { requireActor } from "../auth/adapter.js";
import { requireSiteAccess } from "../auth/site-access.js";
import { buildSiteDigitalTwin } from "../services/digital-twin.js";

export const twinRouter=Router();
twinRouter.use(requireActor);
twinRouter.get("/",async(request,response)=>{
  const {siteId}=z.object({siteId:z.string().min(1)}).parse(request.query);
  await requireSiteAccess(request.actor!,siteId,"twin.read");
  const data=await buildSiteDigitalTwin(request.actor!.organizationId,siteId);
  response.json({data,meta:{requestId:request.requestId,traceId:request.traceId,schemaVersion:"1.0.0",authoritative:data.authoritative,label:data.authoritative?"live":"simulation"}});
});
