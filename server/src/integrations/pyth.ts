import { env } from "../config/env";

type PythParsed = {
  id: string;
  price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
};

export async function fetchPythPrices(feedIds: string[]) {
  if (!env.PYTH_API_KEY) {
    throw Object.assign(
      new Error("PYTH_API_KEY is not configured."),
      { statusCode: 503 },
    );
  }

  const url = new URL(
    `${env.PYTH_HERMES_URL.replace(/\/$/, "")}/v2/updates/price/latest`,
  );

  for (const id of feedIds) {
    url.searchParams.append("ids[]", id);
  }
  url.searchParams.set("parsed", "true");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.PYTH_API_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw Object.assign(
      new Error(`Pyth request failed (${response.status}).`),
      { statusCode: 502 },
    );
  }

  const payload = (await response.json()) as {
    parsed?: PythParsed[];
  };

  return (payload.parsed ?? []).map((item) => {
    const scale = 10 ** item.price.expo;
    return {
      feedId: item.id,
      price: Number(item.price.price) * scale,
      confidence: Number(item.price.conf) * scale,
      exponent: item.price.expo,
      publishTime: item.price.publish_time,
    };
  });
}
