import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../lib/session";
import { getPrice } from "../services/market-price";

export async function registerMarketPriceRoutes(
  app: FastifyInstance,
) {
  app.get("/api/v1/market/price", async (request) => {
    await authenticate(request);

    const query = z
      .object({
        assetKey: z.string().min(1).max(128),
        source: z
          .enum(["PYTH", "BIRDEYE", "AUTO"])
          .default("AUTO"),
      })
      .parse(request.query);

    if (query.source === "AUTO") {
      // Explicit AUTO contract: Solana addresses use Birdeye,
      // all other identifiers are treated as Pyth feed IDs.
      const isLikelySolanaAddress =
        query.assetKey.length >= 32 &&
        query.assetKey.length <= 64 &&
        /^[1-9A-HJ-NP-Za-km-z]+$/.test(query.assetKey);

      return getPrice({
        assetKey: query.assetKey,
        source: isLikelySolanaAddress ? "BIRDEYE" : "PYTH",
      });
    }

    return getPrice({
      assetKey: query.assetKey,
      source: query.source,
    });
  });
}
