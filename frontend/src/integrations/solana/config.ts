import { mobileEnv } from "../../config/env";

export type SolanaNetwork = "devnet" | "mainnet-beta";

export const SOLANA_NETWORK: SolanaNetwork =
  mobileEnv.solanaNetwork;

export const SOLANA_RPC_URL = mobileEnv.solanaRpcUrl;

export const SOLANA_CHAIN =
  SOLANA_NETWORK === "mainnet-beta"
    ? "solana:mainnet"
    : "solana:devnet";

export const POWERCHAIN_IDENTITY = {
  name: "PowerChain Copilot",
  uri: "https://powerchain.ventures",
  icon: "favicon.png",
} as const;
