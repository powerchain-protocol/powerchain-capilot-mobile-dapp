export interface SuiRpcClientOptions {
  rpcUrl: string;
  fetcher?: typeof fetch;
}

export class SuiRpcClient {
  private id = 0;
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: SuiRpcClientOptions) {
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
    if (!response.ok) throw new Error(`SUI_RPC_HTTP_${response.status}`);
    const body = (await response.json()) as { result?: T; error?: { message?: string } };
    if (body.error) throw new Error(`SUI_RPC_ERROR:${body.error.message ?? "unknown"}`);
    return body.result as T;
  }

  getLatestCheckpointSequenceNumber() {
    return this.call<string>("sui_getLatestCheckpointSequenceNumber");
  }

  getObject(objectId: string) {
    return this.call<unknown>("sui_getObject", [
      objectId,
      { showType: true, showOwner: true, showContent: true },
    ]);
  }
}
