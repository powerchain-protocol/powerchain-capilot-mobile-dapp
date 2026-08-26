import { Router } from "express";
import { requireActor } from "../auth/adapter.js";
import { requireSiteAccess } from "../auth/site-access.js";
import { exportSiteEvidence, exportTwinSnapshot, ensureTwinEvidence } from "../services/evidence.js";

export const exportsRouter=Router();
exportsRouter.use(requireActor);
exportsRouter.get("/:siteId/evidence.json",async(request,response)=>{
  const siteId=String(request.params.siteId);
  await requireSiteAccess(request.actor!,siteId,"evidence.read");
  await ensureTwinEvidence(request.actor!.organizationId,siteId);
  response.setHeader("content-disposition",`attachment; filename=powerchain-${siteId}-evidence.json`);
  response.json(await exportSiteEvidence(request.actor!.organizationId,siteId));
});
exportsRouter.get("/:siteId/snapshot.json",async(request,response)=>{
  const siteId=String(request.params.siteId);
  await requireSiteAccess(request.actor!,siteId,"twin.read");
  response.setHeader("content-disposition",`attachment; filename=powerchain-${siteId}-snapshot.json`);
  response.json(await exportTwinSnapshot(request.actor!.organizationId,siteId));
});
