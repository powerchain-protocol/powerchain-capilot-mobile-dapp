import type { IsoTimestamp } from "./common.ts";

export interface MarketPrice {
  symbol: string;
  assetId?: string;
  chain?: string;
  price: string;
  currency: string;
  source: string;
  observedAt: IsoTimestamp;
  confidence?: string;
}

export interface MarketQuoteRequest {
  inputAsset: string;
  outputAsset: string;
  amountBaseUnits: string;
  slippageBps?: number;
}

export interface MarketQuote {
  provider: string;
  inputAsset: string;
  outputAsset: string;
  inputAmountBaseUnits: string;
  outputAmountBaseUnits: string;
  priceImpactPct?: string;
  expiresAt?: IsoTimestamp;
}
