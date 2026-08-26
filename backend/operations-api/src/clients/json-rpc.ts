import { fetchJsonBounded } from './http.ts';

export class JsonRpcClient {
  private id = 0;
  constructor(private readonly url: string, private readonly timeoutMs = 10_000, private readonly maxResponseBytes = 512 * 1024) {}

  async call<T>(method: string, params: unknown[] = []): Promise<T> {
    if (!method || method.length > 128) throw new Error('Invalid RPC method.');
    const { response, payload } = await fetchJsonBounded<{ result?: T; error?: { code?: number; message?: string } }>(this.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++this.id, method, params }),
    }, { timeoutMs: this.timeoutMs, maxBytes: this.maxResponseBytes });
    if (!response.ok) throw new Error(`RPC ${method} failed with status ${response.status}.`);
    if (payload.error) throw new Error(`RPC ${method} failed: ${payload.error.message || payload.error.code || 'unknown error'}`);
    return payload.result as T;
  }
}
