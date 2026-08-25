export type MarketPrice = {
  source: "PYTH" | "BIRDEYE";
  assetKey: string;
  price: number;
  confidence?: number | null;
  observedAt: string;
  cached: boolean;
  stale: boolean;
};

export type MarketPriceRequest = {
  assetKey: string;
  source?: "PYTH" | "BIRDEYE" | "AUTO";
};
