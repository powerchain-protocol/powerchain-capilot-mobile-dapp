import { apiFetch } from "../../api/client";
import type {
  MarketPrice,
  MarketPriceRequest,
} from "../../types/market";

export async function getMarketPrice(
  request: MarketPriceRequest,
) {
  const params = new URLSearchParams({
    assetKey: request.assetKey,
    source: request.source ?? "AUTO",
  });

  return apiFetch<MarketPrice>(
    `/market/price?${params.toString()}`,
  );
}
