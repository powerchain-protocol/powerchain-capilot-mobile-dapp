import { apiRequest } from "../../api/client";

export type SuiHealth = {
  network: "devnet" | "testnet" | "mainnet";
  latestCheckpoint: string;
  status: "ok";
};

export function getSuiHealth() {
  return apiRequest<SuiHealth>("/sui/health");
}
