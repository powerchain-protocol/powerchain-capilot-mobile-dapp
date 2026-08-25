import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../lib/session";
import { env } from "../config/env";

async function rpc<T>(method: string, params: unknown[]) {
  const response = await fetch(env.SOLANA_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw Object.assign(
      new Error(`Solana RPC failed (${response.status}).`),
      { statusCode: 502 },
    );
  }

  const payload = (await response.json()) as {
    result?: T;
    error?: { message?: string };
  };

  if (payload.error) {
    throw Object.assign(
      new Error(payload.error.message ?? "Solana RPC error."),
      { statusCode: 502 },
    );
  }

  return payload.result as T;
}

export async function registerSolanaRoutes(app: FastifyInstance) {
  app.get("/api/v1/solana/balance", async (request) => {
    await authenticate(request);

    const { address } = z
      .object({ address: z.string().min(32).max(64) })
      .parse(request.query);

    const result = await rpc<{ value: number }>(
      "getBalance",
      [address, { commitment: env.SOLANA_COMMITMENT }],
    );

    return {
      network: env.SOLANA_NETWORK,
      address,
      lamports: result.value,
      sol: result.value / 1_000_000_000,
    };
  });

  app.get("/api/v1/solana/health", async (request) => {
    await authenticate(request);
    const result = await rpc<string>("getHealth", []);
    return {
      network: env.SOLANA_NETWORK,
      status: result,
    };
  });
}
