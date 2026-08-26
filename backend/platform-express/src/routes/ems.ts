import { Router } from "express";
import { z } from "zod";
import { requireActor } from "../auth/verifier.js";
import { getEmsOverview, getEnergyFlow, previewDispatch } from "../services/ems.js";

export const emsRouter = Router();
emsRouter.use(requireActor);

emsRouter.get("/overview", async (request, response) => {
  const data = await getEmsOverview(request.actor!.organizationId);
  if (!data) return response.status(404).json({ error: "EMS_DATA_UNAVAILABLE" });
  response.json({ data });
});

emsRouter.get("/flow", async (request, response) => {
  const data = await getEnergyFlow(request.actor!.organizationId);
  if (!data) return response.status(404).json({ error: "EMS_DATA_UNAVAILABLE" });
  response.json({ data });
});

const previewSchema = z.object({
  assetId: z.string().min(1),
  targetPowerMw: z.string().regex(/^-?\d+(?:\.\d+)?$/),
  durationMinutes: z.number().int().positive().max(1440),
  mode: z.enum(["charge", "discharge", "curtail", "generate"]),
  reason: z.string().min(3).max(500),
  expectedResourceVersion: z.number().int().nonnegative().optional(),
});

emsRouter.post("/dispatch/preview", (request, response) => {
  const input = previewSchema.parse(request.body);
  response.json({ data: previewDispatch(input) });
});
