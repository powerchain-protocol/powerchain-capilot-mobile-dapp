import { mobileEnv } from "../config/env";
import type {
  Web3AssetDefinition,
  Web3AssetSymbol,
  Web3NetworkDefinition,
  Web3NetworkId,
  Web3WalletDefinition,
  Web3WalletId,
} from "../types/web3-assets";

export const web3Assets: Record<
  Web3AssetSymbol,
  Web3AssetDefinition
> = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    network: "solana",
    kind: "native",
    decimals: 9,
    icon: {
      provider: "web3icons",
      symbol: "SOL",
    },
  },

  PWRC: {
    symbol: "PWRC",
    name: "PowerChain",
    network: "solana",
    kind: "token",
    decimals: 9,
    mint: mobileEnv.pwrcMint ?? "PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc",
    icon: {
      provider: "powerchain",
      localAsset: "pwrc",
    },
  },

  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    network: "solana",
    kind: "token",
    decimals: 6,
    mint: mobileEnv.usdcMint ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    icon: {
      provider: "web3icons",
      symbol: "USDC",
    },
  },

  EURC: {
    symbol: "EURC",
    name: "EURC",
    network: "solana",
    kind: "token",
    decimals: 6,
    icon: {
      provider: "web3icons",
      symbol: "EURC",
    },
  },

  SUI: {
    symbol: "SUI",
    name: "Sui",
    network: "sui",
    kind: "native",
    decimals: 9,
    icon: {
      provider: "web3icons",
      symbol: "SUI",
    },
  },
};

export const supportedAssetOrder: Web3AssetSymbol[] = [
  "PWRC",
  "SOL",
  "USDC",
  "EURC",
  "SUI",
];

export const web3Networks: Record<
  Web3NetworkId,
  Web3NetworkDefinition
> = {
  solana: {
    id: "solana",
    name: "Solana",
    shortName: "Solana",
    nativeAsset: "SOL",
    iconNetwork: "solana",
  },
  sui: {
    id: "sui",
    name: "Sui",
    shortName: "Sui",
    nativeAsset: "SUI",
    iconNetwork: "sui",
  },
};

export const web3Wallets: Record<
  Web3WalletId,
  Web3WalletDefinition
> = {
  phantom: {
    id: "phantom",
    name: "Phantom",
    iconName: "phantom",
    networks: ["solana"],
  },
  solflare: {
    id: "solflare",
    name: "Solflare",
    iconName: "solflare",
    networks: ["solana"],
  },
  backpack: {
    id: "backpack",
    name: "Backpack",
    iconName: "backpack",
    networks: ["solana"],
  },
  ledger: {
    id: "ledger",
    name: "Ledger",
    iconName: "ledger",
    networks: ["solana", "sui"],
  },
  "wallet-connect": {
    id: "wallet-connect",
    name: "WalletConnect",
    iconName: "wallet-connect",
    networks: ["solana", "sui"],
  },
  generic: {
    id: "generic",
    name: "Wallet",
    networks: ["solana", "sui"],
  },
};
