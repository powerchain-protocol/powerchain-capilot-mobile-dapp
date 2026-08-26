import type { MarketPrice } from "@powerchain/energy-contracts";
import { config, marketProviders } from "../config.js";
import { fetchBoundedJson, ProviderError } from "./provider-http.js";

export interface OperationsMarketDataProvider {
  id: string;
  prices(symbols: string[]): Promise<MarketPrice[]>;
  health(): Promise<void>;
}

class CoinGeckoProvider implements OperationsMarketDataProvider {
  id = "coingecko";
  private headers() {
    const headers: Record<string, string> = {};
    if (config.COINGECKO_API_KEY) headers["x-cg-demo-api-key"] = config.COINGECKO_API_KEY;
    return headers;
  }
  async prices(symbols: string[]) {
    const ids: Record<string,string> = { SOL: "solana" };
    const wanted = symbols.filter((s) => ids[s]);
    if (!wanted.length) return [];
    const qs = new URLSearchParams({ ids: wanted.map((s)=>ids[s]).join(","), vs_currencies: "usd" });
    const data = await fetchBoundedJson<Record<string,{usd?:number}>>(this.id, `${config.COINGECKO_API_BASE_URL}/simple/price?${qs}`, { headers: this.headers() });
    const now = new Date().toISOString();
    return wanted.flatMap((symbol) => data[ids[symbol]]?.usd == null ? [] : [{ symbol, price: String(data[ids[symbol]].usd), currency: "USD", source: this.id, observedAt: now }]);
  }
  async health() { await this.prices(["SOL"]); }
}

const providers: OperationsMarketDataProvider[] =
  marketProviders.includes("coingecko") ? [new CoinGeckoProvider()] : [];

export const marketDataProviderIds = providers.map((provider) => provider.id);
export const marketDataProviders = providers;

export async function getMarketPrices(symbols: string[]): Promise<MarketPrice[]> {
  const normalized = [...new Set(symbols.map((s)=>s.trim().toUpperCase()).filter(Boolean))].slice(0, 20);
  const bySymbol = new Map<string,MarketPrice>();
  const failures: ProviderError[] = [];
  for (const provider of providers) {
    try {
      for (const price of await provider.prices(normalized)) if (!bySymbol.has(price.symbol)) bySymbol.set(price.symbol, price);
    } catch (error) {
      if (error instanceof ProviderError) failures.push(error);
    }
  }
  const result = normalized.map((symbol) => bySymbol.get(symbol)).filter((v): v is MarketPrice => Boolean(v));
  if (!result.length && normalized.length && providers.length && failures.length === providers.length) {
    throw new ProviderError("market-data", "PROVIDER_ERROR", failures.map((e)=>`${e.provider}:${e.code}`).join(","));
  }
  return result;
}
