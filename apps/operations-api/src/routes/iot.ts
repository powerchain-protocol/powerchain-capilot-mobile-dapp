import { Router } from "express";
import { z } from "zod";
import { requireActor } from "../auth/adapter.js";
import { requireSiteAccess } from "../auth/site-access.js";
import { listIotDevices, listTelemetry } from "../services/iot.js";

export const iotRouter = Router();
iotRouter.use(requireActor);
const siteQuery = z.object({ siteId: z.string().min(1) });

iotRouter.get("/devices", async (request, response) => {
  const { siteId } = siteQuery.parse(request.query);
  await requireSiteAccess(request.actor!, siteId, "iot.read");
  response.json({ data: await listIotDevices(request.actor!.organizationId, siteId), meta: { requestId: request.requestId, traceId: request.traceId, schemaVersion: "1.0.0" } });
});

iotRouter.get("/devices/:deviceId/telemetry", async (request, response) => {
  const { siteId } = siteQuery.parse(request.query);
  await requireSiteAccess(request.actor!, siteId, "iot.read");
  const deviceId = z.string().min(1).parse(request.params.deviceId);
  const limit = z.coerce.number().int().min(1).max(500).default(100).parse(request.query.limit ?? 100);
  response.json({ data: await listTelemetry(request.actor!.organizationId, siteId, deviceId, limit), meta: { requestId: request.requestId, traceId: request.traceId, schemaVersion: "1.0.0" } });
});
