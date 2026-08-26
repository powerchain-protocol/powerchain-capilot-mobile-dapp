import { config } from "../config.js";
import { fetchBoundedJson, ProviderError } from "./provider-http.js";

const ALLOWED = new Set([
  "sui_getLatestCheckpointSequenceNumber",
  "sui_getObject",
  "suix_getBalance",
  "suix_getAllBalances",
  "suix_getCoins",
  "suix_getDynamicFields",
]);
let rpcId = 0;

export async function suiReadRpc<T>(method: string, params: unknown[] = []): Promise<T> {
  if (!ALLOWED.has(method)) throw new ProviderError("sui", "PROVIDER_ERROR", `SUI_METHOD_NOT_READ_ONLY:${method}`);
  const body = await fetchBoundedJson<{ result?: T; error?: { message?: string } }>(
    "sui",
    config.SUI_RPC_URL,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
    },
  );
  if (body.error) throw new ProviderError("sui", "PROVIDER_ERROR", `SUI_RPC_ERROR:${body.error.message ?? "unknown"}`);
  return body.result as T;
}
