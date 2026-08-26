export interface SolanaRpcClientOptions {
  rpcUrl: string;
  fetcher?: typeof fetch;
  commitment?: "processed" | "confirmed" | "finalized";
}

export class SolanaRpcClient {
  private id = 0;
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: SolanaRpcClientOptions) {
    this.fetcher = options.fetcher ?? fetch;
  }

  async call<T>(method: string, params: unknown[] = []): Promise<T> {
    const response = await this.fetcher(this.options.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: ++this.id,
        method,
        params,
      }),
    });
    if (!response.ok) throw new Error(`SOLANA_RPC_HTTP_${response.status}`);
    const body = (await response.json()) as { result?: T; error?: { message?: string } };
    if (body.error) throw new Error(`SOLANA_RPC_ERROR:${body.error.message ?? "unknown"}`);
    return body.result as T;
  }

  getHealth() {
    return this.call<string>("getHealth");
  }

  getLatestBlockhash() {
    return this.call<unknown>("getLatestBlockhash", [
      { commitment: this.options.commitment ?? "confirmed" },
    ]);
  }

  getBalance(address: string) {
    return this.call<unknown>("getBalance", [
      address,
      { commitment: this.options.commitment ?? "confirmed" },
    ]);
  }

  getAccountInfo(address: string) {
    return this.call<unknown>("getAccountInfo", [
      address,
      { encoding: "base64", commitment: this.options.commitment ?? "confirmed" },
    ]);
  }
}
