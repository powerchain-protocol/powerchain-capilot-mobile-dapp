import { Router } from "express";
import { z } from "zod";
import { requireActor } from "../auth/adapter.js";
import { requireSiteAccess } from "../auth/site-access.js";
import { getEmsOverview, getEnergyFlow } from "../services/ems.js";

export const emsRouter = Router();
emsRouter.use(requireActor);
const siteQuery = z.object({ siteId: z.string().min(1) });

emsRouter.get("/overview", async (request, response) => {
  const { siteId } = siteQuery.parse(request.query);
  await requireSiteAccess(request.actor!, siteId, "ems.read");
  const data = await getEmsOverview(request.actor!.organizationId, siteId);
  if (!data) return response.status(404).json({ error: "EMS_DATA_UNAVAILABLE" });
  response.json({ data, meta: { requestId: request.requestId, traceId: request.traceId, source: data.source, schemaVersion: "1.0.0" } });
});

emsRouter.get("/flow", async (request, response) => {
  const { siteId } = siteQuery.parse(request.query);
  await requireSiteAccess(request.actor!, siteId, "ems.read");
  const data = await getEnergyFlow(request.actor!.organizationId, siteId);
  if (!data) return response.status(404).json({ error: "EMS_DATA_UNAVAILABLE" });
  response.json({ data, meta: { requestId: request.requestId, traceId: request.traceId, source: data.source, schemaVersion: "1.0.0" } });
});
