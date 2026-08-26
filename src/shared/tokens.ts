import {
  PWRC_DECIMALS,
  PWRC_MESSAGE_COST_BASE_UNITS,
  PWRC_MESSAGE_COST_TOKENS,
  PWRC_MESSAGE_REFERENCE_USD_MICROS,
  PWRC_MINT,
  PWRC_NETWORK,
  PWRC_PRICING_VERSION,
  PWRC_REFERENCE_USD_MICROS_PER_TOKEN,
  PWRC_SYMBOL,
  PWRC_TOKEN_2022_PROGRAM,
} from "@powerchain/pwrc-credits";

export const SOLANA_PROGRAMS = {
  system: "11111111111111111111111111111111",
  token: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  token2022: PWRC_TOKEN_2022_PROGRAM,
  associatedToken: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  computeBudget: "ComputeBudget111111111111111111111111111111",
  memo: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
} as const;

export const METAPLEX_PROGRAMS = {
  tokenMetadata: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
  core: "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
  bubblegum: "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY",
  tokenAuthRules: "auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg",
} as const;

export const PWRC_TOKEN = {
  symbol: PWRC_SYMBOL,
  name: "PowerChain Token",
  decimals: PWRC_DECIMALS,
  network: PWRC_NETWORK,
  mint: PWRC_MINT,
  tokenProgram: PWRC_TOKEN_2022_PROGRAM,
  pricingVersion: PWRC_PRICING_VERSION,
  copilotMessageTokens: PWRC_MESSAGE_COST_TOKENS,
  copilotMessageBaseUnits: PWRC_MESSAGE_COST_BASE_UNITS,
  referenceUsdMicrosPerToken: PWRC_REFERENCE_USD_MICROS_PER_TOKEN,
  referenceUsdMicrosPerMessage: PWRC_MESSAGE_REFERENCE_USD_MICROS,
  referenceUsdPerToken: "0.000002",
  referenceUsdPerMessage: "0.02",
} as const;

export type PowerChainTokenSymbol = "PWRC" | "SOL" | "USDC" | "EURC" | "SUI";

export const TOKEN_LABELS: Record<PowerChainTokenSymbol, string> = {
  PWRC: "PowerChain Token",
  SOL: "Solana",
  USDC: "USD Coin",
  EURC: "Euro Coin",
  SUI: "Sui",
};
