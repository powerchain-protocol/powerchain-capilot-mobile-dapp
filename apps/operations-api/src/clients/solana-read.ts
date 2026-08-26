import { config } from "../config.js";
import { fetchBoundedJson, ProviderError } from "./provider-http.js";

const ALLOWED = new Set([
  "getBalance",
  "getTokenAccountBalance",
  "getAccountInfo",
  "getLatestBlockhash",
  "getSignatureStatuses",
]);
let rpcId = 0;

export async function solanaReadRpc<T>(method: string, params: unknown[] = []): Promise<T> {
  if (!ALLOWED.has(method)) throw new ProviderError("solana", "PROVIDER_ERROR", `SOLANA_METHOD_NOT_READ_ONLY:${method}`);
  const body = await fetchBoundedJson<{ result?: T; error?: { message?: string } }>(
    "solana",
    config.SOLANA_RPC_URL,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
    },
  );
  if (body.error) throw new ProviderError("solana", "PROVIDER_ERROR", `SOLANA_RPC_ERROR:${body.error.message ?? "unknown"}`);
  return body.result as T;
}
