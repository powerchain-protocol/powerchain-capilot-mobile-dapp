import { Router } from "express";
import { z } from "zod";
import { requireActor } from "../auth/adapter.js";
import { getMarketPrices } from "../clients/market-data.js";

export const marketDataRouter = Router();
marketDataRouter.use(requireActor);
marketDataRouter.get("/prices", async (request, response) => {
  const symbols = z.string().min(1).parse(request.query.symbols).split(",").map((s) => s.trim()).filter(Boolean);
  response.json({ data: await getMarketPrices(symbols), meta: { requestId: request.requestId, traceId: request.traceId, schemaVersion: "1.0.0" } });
});
