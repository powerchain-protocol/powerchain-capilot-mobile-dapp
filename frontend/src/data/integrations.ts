import type { IntegrationId } from "../types/integrations";

export type IntegrationDefinition = {
  id: IntegrationId;
  name: string;
  description: string;
  category: "ai" | "blockchain" | "market" | "data";
};

export const integrations: IntegrationDefinition[] = [
  {
    id: "openai",
    name: "PowerChain Copilot AI",
    description: "AI reasoning and conversation service.",
    category: "ai",
  },
  {
    id: "solana",
    name: "Solana",
    description: "Wallet, settlement, and blockchain state.",
    category: "blockchain",
  },
  {
    id: "pyth",
    name: "Pyth",
    description: "Oracle price feeds and confidence data.",
    category: "market",
  },
  {
    id: "birdeye",
    name: "Birdeye",
    description: "Solana token market data and liquidity context.",
    category: "market",
  },
  {
    id: "database",
    name: "PowerChain Data",
    description: "Accounts, conversations, provenance, and cached data.",
    category: "data",
  },
];
