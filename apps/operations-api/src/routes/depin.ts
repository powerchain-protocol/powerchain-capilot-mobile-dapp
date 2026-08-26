import { Router } from "express";
import { z } from "zod";
import { requireActor } from "../auth/adapter.js";
import { requireSiteAccess } from "../auth/site-access.js";
import { listDepinNodes, summarizeDepin } from "../services/depin.js";

export const depinRouter = Router();
depinRouter.use(requireActor);
const siteQuery = z.object({ siteId: z.string().min(1) });

depinRouter.get("/nodes", async (request, response) => {
  const { siteId } = siteQuery.parse(request.query);
  await requireSiteAccess(request.actor!, siteId, "depin.read");
  response.json({ data: await listDepinNodes(request.actor!.organizationId, siteId), meta: { requestId: request.requestId, traceId: request.traceId, schemaVersion: "1.0.0" } });
});

depinRouter.get("/summary", async (request, response) => {
  const { siteId } = siteQuery.parse(request.query);
  await requireSiteAccess(request.actor!, siteId, "depin.read");
  response.json({ data: await summarizeDepin(request.actor!.organizationId, siteId), meta: { requestId: request.requestId, traceId: request.traceId, schemaVersion: "1.0.0" } });
});
