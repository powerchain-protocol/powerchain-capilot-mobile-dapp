export type Web3AssetSymbol =
  | "SOL"
  | "PWRC"
  | "USDC"
  | "EURC"
  | "SUI";

export type Web3NetworkId =
  | "solana"
  | "sui";

export type Web3WalletId =
  | "phantom"
  | "solflare"
  | "backpack"
  | "ledger"
  | "wallet-connect"
  | "generic";

export type Web3IconVariant =
  | "mono"
  | "branded"
  | "background";

export type Web3AssetDefinition = {
  symbol: Web3AssetSymbol;
  name: string;
  network: Web3NetworkId;
  kind: "native" | "token";
  decimals?: number;
  mint?: string;
  icon: {
    provider: "web3icons" | "powerchain";
    symbol?: string;
    localAsset?: string;
  };
};

export type Web3NetworkDefinition = {
  id: Web3NetworkId;
  name: string;
  shortName: string;
  nativeAsset: Web3AssetSymbol;
  iconNetwork: string;
};

export type Web3WalletDefinition = {
  id: Web3WalletId;
  name: string;
  iconName?: string;
  networks: Web3NetworkId[];
};
