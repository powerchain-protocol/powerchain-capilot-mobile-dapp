import { prisma } from "../lib/prisma";
import { fetchPythPrices } from "../integrations/pyth";
import { fetchBirdeyePrice } from "../integrations/birdeye";
import { env } from "../config/env";

const FRESH_MS = env.MARKET_CACHE_FRESH_MS;
const STALE_MS = env.MARKET_CACHE_STALE_MS;

async function latest(
  source: "PYTH" | "BIRDEYE",
  assetKey: string,
) {
  return prisma.priceSnapshot.findFirst({
    where: { source, assetKey },
    orderBy: { observedAt: "desc" },
  });
}

function mapSnapshot(snapshot: any, cached: boolean) {
  const age = Date.now() - new Date(snapshot.observedAt).getTime();

  return {
    source: snapshot.source,
    assetKey: snapshot.assetKey,
    price: Number(snapshot.price),
    confidence:
      snapshot.confidence == null
        ? null
        : Number(snapshot.confidence),
    observedAt: new Date(snapshot.observedAt).toISOString(),
    cached,
    stale: age > STALE_MS,
  };
}

export async function getPrice(input: {
  assetKey: string;
  source: "PYTH" | "BIRDEYE";
}) {
  const cached = await latest(input.source, input.assetKey);

  if (
    cached &&
    Date.now() - cached.observedAt.getTime() <= FRESH_MS
  ) {
    return mapSnapshot(cached, true);
  }

  if (input.source === "PYTH") {
    const [price] = await fetchPythPrices([input.assetKey]);

    if (!price) {
      if (cached) return mapSnapshot(cached, true);
      throw Object.assign(new Error("Pyth price unavailable."), {
        statusCode: 404,
      });
    }

    const snapshot = await prisma.priceSnapshot.create({
      data: {
        source: "PYTH",
        assetKey: price.feedId,
        price: String(price.price),
        confidence: String(price.confidence),
        exponent: price.exponent,
        observedAt: new Date(price.publishTime * 1000),
      },
    });

    return mapSnapshot(snapshot, false);
  }

  const price = await fetchBirdeyePrice(input.assetKey);

  if (price.value == null) {
    if (cached) return mapSnapshot(cached, true);
    throw Object.assign(new Error("Birdeye price unavailable."), {
      statusCode: 404,
    });
  }

  const snapshot = await prisma.priceSnapshot.create({
    data: {
      source: "BIRDEYE",
      assetKey: input.assetKey,
      mint: input.assetKey,
      price: String(price.value),
      observedAt: new Date(
        (price.updateUnixTime ?? Math.floor(Date.now() / 1000)) * 1000,
      ),
    },
  });

  return mapSnapshot(snapshot, false);
}
