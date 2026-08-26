export const PWRC_IDENTITY = {
  name: 'PowerChain',
  symbol: 'PWRC',
  network: 'mainnet-beta',
  networkLabel: 'Solana mainnet-beta',
  standard: 'Token-2022',
  programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  mint: 'PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc',
  decimals: 9,
  explorerUrl: 'https://explorer.solana.com/address/PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc',
} as const;

export const PWRC_BASE_UNITS_PER_TOKEN = 1_000_000_000n;
export const COPILOT_RESPONSE_COST_BASE_UNITS = 10_000_000_000_000n;
export const DEMO_GRANT_BASE_UNITS = 1_000_000_000_000_000n;

export const COPILOT_MESSAGE_UNIT = 'MSG UNIT' as const;
export const PWRC_REFERENCE_PRICE_USD = '0.000002';
export const COPILOT_RESPONSE_REFERENCE_VALUE_USD = '0.02';
export const COPILOT_RESPONSE_COST_LABEL = '10,000 PWRC / response · ≈ $0.02 ref';
