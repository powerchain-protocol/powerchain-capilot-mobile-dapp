import type { DataMode, MarketPrice } from '@powerchain/operations-contracts';
import { fetchJsonBounded } from './http.ts';

export interface MarketDataClient {
  getPrices(symbols: string[]): Promise<MarketPrice[]>;
  health(): Promise<{ status: 'ok' | 'down' | 'not_configured'; latencyMs?: number; detail?: string }>;
}

export class HttpMarketDataClient implements MarketDataClient {
  constructor(private readonly config: { baseUrl: string; apiKey?: string; apiKeyHeader?: string; mode: DataMode; timeoutMs?: number; maxResponseBytes?: number }) {}

  async health() {
    if (!this.config.baseUrl) return { status: 'not_configured' as const };
    const started = Date.now();
    try {
      const { response } = await fetchJsonBounded<unknown>(`${this.config.baseUrl.replace(/\/+$/, '')}/health`, { method: 'GET', headers: this.headers() }, this.bounds());
      return { status: response.ok ? 'ok' as const : 'down' as const, latencyMs: Date.now() - started, detail: response.ok ? undefined : `HTTP ${response.status}` };
    } catch (error) {
      return { status: 'down' as const, latencyMs: Date.now() - started, detail: error instanceof Error ? error.message : 'Market data unavailable.' };
    }
  }

  async getPrices(symbols: string[]) {
    if (!this.config.baseUrl) return [];
    const normalized = [...new Set(symbols.map((value) => value.trim().toUpperCase()).filter((value) => /^[A-Z0-9._:-]{1,24}$/.test(value)))].slice(0, 20);
    if (!normalized.length) return [];
    const url = new URL(`${this.config.baseUrl.replace(/\/+$/, '')}/prices`);
    url.searchParams.set('symbols', normalized.join(','));
    const { response, payload } = await fetchJsonBounded<{ prices?: Array<{ symbol?: unknown; price?: unknown; currency?: unknown; provider?: unknown; observedAt?: unknown }> }>(url, { headers: this.headers() }, this.bounds());
    if (!response.ok) throw new Error(`Market data request failed with status ${response.status}.`);
    const receivedAt = new Date().toISOString();
    return (payload.prices ?? []).flatMap((item): MarketPrice[] => {
      const symbol = typeof item.symbol === 'string' ? item.symbol.toUpperCase() : '';
      const price = typeof item.price === 'string' || typeof item.price === 'number' ? String(item.price) : '';
      if (!symbol || !price || !/^-?\d+(?:\.\d+)?$/.test(price)) return [];
      const observedAt = typeof item.observedAt === 'string' && Number.isFinite(Date.parse(item.observedAt)) ? item.observedAt : null;
      const provider = typeof item.provider === 'string' && item.provider.trim() ? item.provider.trim().slice(0, 128) : new URL(this.config.baseUrl).hostname;
      return [{
        symbol,
        price,
        currency: typeof item.currency === 'string' && /^[A-Z0-9]{2,12}$/i.test(item.currency) ? item.currency.toUpperCase() : 'USD',
        provider,
        observedAt,
        source: { source: provider, mode: this.config.mode, observedAt, receivedAt, freshness: observedAt ? 'fresh' : 'unknown' },
      }];
    });
  }

  private headers() {
    return this.config.apiKey ? { [this.config.apiKeyHeader || 'x-api-key']: this.config.apiKey, accept: 'application/json' } : { accept: 'application/json' };
  }
  private bounds() { return { timeoutMs: this.config.timeoutMs ?? 8_000, maxBytes: this.config.maxResponseBytes ?? 512 * 1024 }; }
}
