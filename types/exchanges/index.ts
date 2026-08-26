export type ExchangeId = 'jupiter' | 'orca' | 'raydium' | 'meteora' | 'cetus';
export type ExchangeNetwork = 'solana' | 'sui';
export type ExchangeDescriptor = {
  id: ExchangeId;
  label: string;
  network: ExchangeNetwork;
  mode: 'read-only' | 'wallet-execution';
  enabledByDefault: boolean;
};
export type ExchangeQuote = {
  exchange: ExchangeId;
  inputAsset: string;
  outputAsset: string;
  inputAmount: string;
  outputAmount: string;
  observedAt: string;
  expiresAt?: string;
};
