import { Router } from "express";
import { requireActor } from "../auth/verifier.js";
import { listDepinNodes, summarizeDepin } from "../services/depin.js";

export const depinRouter = Router();
depinRouter.use(requireActor);

depinRouter.get("/nodes", async (request, response) => {
  response.json({ data: await listDepinNodes(request.actor!.organizationId) });
});

depinRouter.get("/summary", async (request, response) => {
  response.json({ data: await summarizeDepin(request.actor!.organizationId) });
});
