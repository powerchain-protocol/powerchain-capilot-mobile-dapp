export const PWRC_DECIMALS = 9;
export const PWRC_BASE_UNITS_PER_TOKEN = 1_000_000_000n;

export const PWRC_IDENTITY = Object.freeze({
  symbol: 'PWRC',
  name: 'PowerChain',
  network: 'mainnet-beta',
  networkLabel: 'Solana mainnet-beta',
  standard: 'Token-2022',
  programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  mint: 'PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc',
  decimals: PWRC_DECIMALS,
  explorerUrl:
    'https://explorer.solana.com/address/PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc',
});

export const PWRC_FIXED_SUPPLY = 18_446_000_000n;
export const PWRC_FIXED_SUPPLY_BASE_UNITS = PWRC_FIXED_SUPPLY * PWRC_BASE_UNITS_PER_TOKEN;

export const COPILOT_RESPONSE_COST_PWRC = 10_000n;
export const COPILOT_RESPONSE_COST_BASE_UNITS =
  COPILOT_RESPONSE_COST_PWRC * PWRC_BASE_UNITS_PER_TOKEN;

// Configured initial/reference economics only. This is not a live market price.
// 1 micro-USD = 0.000001 USD; 2 micro-USD/PWRC = $0.000002/PWRC.
export const PWRC_REFERENCE_PRICE_MICRO_USD_PER_TOKEN = 2n;
export const PWRC_REFERENCE_PRICE_USD = '0.000002';
export const COPILOT_RESPONSE_REFERENCE_VALUE_MICRO_USD =
  COPILOT_RESPONSE_COST_PWRC * PWRC_REFERENCE_PRICE_MICRO_USD_PER_TOKEN;
export const COPILOT_RESPONSE_REFERENCE_VALUE_USD = '0.02';
export const COPILOT_MESSAGE_UNIT = 'MSG UNIT' as const;
export const PWRC_REFERENCE_PRICE_SOURCE = 'configured-initial-reference' as const;
export const PWRC_REFERENCE_FUNDING_PRESETS_PWRC = [500_000n, 2_500_000n, 5_000_000n, 10_000_000n] as const;

export const DEMO_GRANT_PWRC = 1_000_000n;
export const DEMO_GRANT_BASE_UNITS = DEMO_GRANT_PWRC * PWRC_BASE_UNITS_PER_TOKEN;
export const DEMO_GRANT_RESPONSES = DEMO_GRANT_BASE_UNITS / COPILOT_RESPONSE_COST_BASE_UNITS;

export const CREDIT_PRICE_VERSION = 'pwrc-copilot-v1';
export const DEFAULT_QUOTE_TTL_MS = 5 * 60 * 1_000;
export const DEFAULT_RESERVATION_TTL_MS = 2 * 60 * 1_000;
export const DEFAULT_TOP_UP_TTL_MS = 30 * 60 * 1_000;
export const PAYMENT_KERNEL_REPLAY_WINDOW_MS = 5 * 60 * 1_000;
export const PAYMENT_KERNEL_MAX_BODY_BYTES = 64 * 1024;
