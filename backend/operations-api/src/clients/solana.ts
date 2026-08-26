import { JsonRpcClient } from './json-rpc.ts';

export class SolanaReadClient {
  private readonly rpc: JsonRpcClient;
  constructor(url: string, timeoutMs = 8_000, maxResponseBytes = 512 * 1024) { this.rpc = new JsonRpcClient(url, timeoutMs, maxResponseBytes); }

  async health() {
    const started = Date.now();
    try {
      const result = await this.rpc.call<string>('getHealth');
      return { status: result === 'ok' ? 'ok' as const : 'degraded' as const, latencyMs: Date.now() - started };
    } catch (error) {
      return { status: 'down' as const, latencyMs: Date.now() - started, detail: error instanceof Error ? error.message : 'Solana RPC unavailable.' };
    }
  }

  getLatestBlockhash() {
    return this.rpc.call<{ context: { slot: number }; value: { blockhash: string; lastValidBlockHeight: number } }>('getLatestBlockhash', [{ commitment: 'confirmed' }]);
  }

  getBalance(address: string) {
    return this.rpc.call<{ context: { slot: number }; value: number }>('getBalance', [address, { commitment: 'confirmed' }]);
  }
}
