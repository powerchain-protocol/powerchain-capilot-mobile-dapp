import { Router } from "express";
import { z } from "zod";
import { requireActor } from "../auth/verifier.js";
import { listIotDevices, listTelemetry } from "../services/iot.js";

export const iotRouter = Router();
iotRouter.use(requireActor);

iotRouter.get("/devices", async (request, response) => {
  const data = await listIotDevices(request.actor!.organizationId);
  response.json({ data });
});

iotRouter.get("/devices/:deviceId/telemetry", async (request, response) => {
  const deviceId = z.string().min(1).parse(request.params.deviceId);
  const limit = z.coerce.number().int().min(1).max(500).default(100).parse(request.query.limit ?? 100);
  const data = await listTelemetry(request.actor!.organizationId, deviceId, limit);
  response.json({ data });
});
