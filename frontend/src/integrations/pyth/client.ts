import { apiFetch } from "../../api/client";
import type { PythPrice } from "./types";

export async function getPythPrices(feedIds: string[]) {
  const params = new URLSearchParams();
  for (const id of feedIds) {
    params.append("id", id);
  }

  return apiFetch<{ prices: PythPrice[] }>(
    `/market/pyth?${params.toString()}`,
  );
}
