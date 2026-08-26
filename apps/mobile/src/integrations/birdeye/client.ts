import { apiFetch } from "../../api/client";
import type { BirdeyeTokenPrice } from "./types";

export async function getBirdeyeTokenPrice(address: string) {
  return apiFetch<BirdeyeTokenPrice>(
    `/market/birdeye/price?address=${encodeURIComponent(address)}`,
  );
}
