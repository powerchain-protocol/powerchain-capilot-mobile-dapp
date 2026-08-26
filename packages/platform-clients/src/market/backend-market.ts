import type { MarketPrice, MarketQuote, MarketQuoteRequest } from "@powerchain/energy-contracts";
import { JsonHttpClient } from "../http.ts";

export interface MarketDataClient {
  getPrice(symbol: string): Promise<MarketPrice>;
  quote(request: MarketQuoteRequest): Promise<MarketQuote>;
}

export class BackendMarketDataClient implements MarketDataClient {
  constructor(private readonly http: JsonHttpClient) {}

  getPrice(symbol: string) {
    return this.http.request<MarketPrice>(`/market/price?symbol=${encodeURIComponent(symbol)}`);
  }

  quote(request: MarketQuoteRequest) {
    return this.http.request<MarketQuote>("/market/quote", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }
}
