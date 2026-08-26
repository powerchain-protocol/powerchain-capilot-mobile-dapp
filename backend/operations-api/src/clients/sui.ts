import { JsonRpcClient } from './json-rpc.ts';

export class SuiReadClient {
  private readonly rpc: JsonRpcClient;
  constructor(url: string, timeoutMs = 8_000, maxResponseBytes = 512 * 1024) { this.rpc = new JsonRpcClient(url, timeoutMs, maxResponseBytes); }

  async health() {
    const started = Date.now();
    try {
      await this.rpc.call<string>('sui_getLatestCheckpointSequenceNumber');
      return { status: 'ok' as const, latencyMs: Date.now() - started };
    } catch (error) {
      return { status: 'down' as const, latencyMs: Date.now() - started, detail: error instanceof Error ? error.message : 'Sui RPC unavailable.' };
    }
  }

  getLatestCheckpointSequenceNumber() {
    return this.rpc.call<string>('sui_getLatestCheckpointSequenceNumber');
  }

  getBalance(owner: string, coinType?: string) {
    return this.rpc.call<{ coinType: string; coinObjectCount: number; totalBalance: string; lockedBalance: Record<string, string> }>('suix_getBalance', coinType ? [owner, coinType] : [owner]);
  }
}
