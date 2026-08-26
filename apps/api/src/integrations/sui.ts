import { env } from "../config/env";

type JsonRpcResponse<T> = {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: {
    code?: number;
    message?: string;
  };
};

export async function suiRpc<T>(
  method: string,
  params: unknown[] = [],
) {
  const response = await fetch(env.SUI_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw Object.assign(
      new Error(`Sui RPC failed (${response.status}).`),
      { statusCode: 502 },
    );
  }

  const payload = (await response.json()) as JsonRpcResponse<T>;

  if (payload.error) {
    throw Object.assign(
      new Error(payload.error.message ?? "Sui RPC error."),
      { statusCode: 502 },
    );
  }

  return payload.result as T;
}

export async function getSuiLatestCheckpoint() {
  return suiRpc<string>("sui_getLatestCheckpointSequenceNumber");
}
