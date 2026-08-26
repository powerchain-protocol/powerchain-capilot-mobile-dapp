import { Router } from "express";
import { z } from "zod";
import { requireActor } from "../auth/adapter.js";
import { listWalletIdentities, registerPublicWallet } from "../wallet/registry.js";

export const walletsRouter = Router();
walletsRouter.use(requireActor);
walletsRouter.get("/", async (request, response) => response.json({ data: await listWalletIdentities(request.actor!.organizationId, request.actor!.userId) }));
walletsRouter.post("/identities", async (request, response) => {
  const body = z.object({ chain: z.enum(["solana","sui"]), address: z.string().min(1), label: z.string().max(80).optional() }).parse(request.body);
  const row = await registerPublicWallet({ organizationId: request.actor!.organizationId, userId: request.actor!.userId, ...body });
  response.status(201).json({ data: { id: row.id, chain: row.chain, address: row.address, label: row.label, isPrimary: row.isPrimary } });
});
