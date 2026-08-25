import { apiRequest } from "./client";

export type RuntimeConfig = {
  release: string;
  environment: string;
  solana: {
    network: "devnet" | "mainnet-beta";
    commitment: "processed" | "confirmed" | "finalized";
    token2022Program: string;
    assets: {
      pwrc: string;
      usdc: string;
      eurc: string | null;
    };
  };
  sui: {
    network: "devnet" | "testnet" | "mainnet";
  };
  integrations: {
    ai: boolean;
    pyth: boolean;
    birdeye: boolean;
  };
  limits: {
    messageCharacters: number;
  };
};

export function getRuntimeConfig() {
  return apiRequest<RuntimeConfig>("/config");
}
