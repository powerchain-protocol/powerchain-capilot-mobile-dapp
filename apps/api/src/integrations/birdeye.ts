import { env } from "../config/env";

export async function fetchBirdeyePrice(address: string) {
  if (!env.BIRDEYE_API_KEY) {
    throw Object.assign(
      new Error("BIRDEYE_API_KEY is not configured."),
      { statusCode: 503 },
    );
  }

  const url = new URL("/defi/price", env.BIRDEYE_BASE_URL);
  url.searchParams.set("address", address);
  url.searchParams.set("include_liquidity", "true");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-KEY": env.BIRDEYE_API_KEY,
      "x-chain": "solana",
    },
  });

  if (!response.ok) {
    throw Object.assign(
      new Error(`Birdeye request failed (${response.status}).`),
      { statusCode: response.status === 429 ? 429 : 502 },
    );
  }

  const payload = (await response.json()) as {
    success?: boolean;
    data?: {
      value?: number | null;
      updateUnixTime?: number | null;
      liquidity?: number | null;
    };
  };

  return {
    address,
    value: payload.data?.value ?? null,
    updateUnixTime: payload.data?.updateUnixTime ?? null,
    liquidity: payload.data?.liquidity ?? null,
  };
}
