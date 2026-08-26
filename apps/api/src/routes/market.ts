import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../lib/session";
import { fetchPythPrices } from "../integrations/pyth";
import { fetchBirdeyePrice } from "../integrations/birdeye";
import { prisma } from "../lib/prisma";

export async function registerMarketRoutes(app: FastifyInstance) {
  app.get("/api/v1/market/pyth", async (request) => {
    await authenticate(request);

    const query = z
      .object({
        id: z.union([
          z.string(),
          z.array(z.string()),
        ]),
      })
      .parse(request.query);

    const ids = Array.isArray(query.id)
      ? query.id
      : [query.id];

    const prices = await fetchPythPrices(ids.slice(0, 20));

    for (const price of prices) {
      await prisma.priceSnapshot.create({
        data: {
          source: "PYTH",
          assetKey: price.feedId,
          price: String(price.price),
          confidence: String(price.confidence),
          exponent: price.exponent,
          observedAt: new Date(price.publishTime * 1000),
        },
      });
    }

    return { prices };
  });

  app.get("/api/v1/market/birdeye/price", async (request) => {
    await authenticate(request);

    const { address } = z
      .object({
        address: z.string().min(32).max(64),
      })
      .parse(request.query);

    const result = await fetchBirdeyePrice(address);

    if (result.value != null) {
      await prisma.priceSnapshot.create({
        data: {
          source: "BIRDEYE",
          assetKey: address,
          mint: address,
          price: String(result.value),
          observedAt: new Date(
            (result.updateUnixTime ?? Math.floor(Date.now() / 1000)) * 1000,
          ),
        },
      });
    }

    return result;
  });
}
