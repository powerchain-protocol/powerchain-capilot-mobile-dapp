export const PWRC_SYMBOL = "PWRC" as const;
export const PWRC_NETWORK = "mainnet-beta" as const;
export const PWRC_MINT =
  "PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc" as const;
export const PWRC_TOKEN_2022_PROGRAM =
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" as const;

export const PWRC_DECIMALS = 9 as const;
export const PWRC_BASE_UNITS_PER_TOKEN = 1_000_000_000n;

export const PWRC_MESSAGE_COST_TOKENS = 10_000n;
export const PWRC_MESSAGE_COST_BASE_UNITS =
  PWRC_MESSAGE_COST_TOKENS * PWRC_BASE_UNITS_PER_TOKEN;

// Reference economics only. This is intentionally NOT a live market price.
// 1 PWRC = $0.000002 = 2 USD micros.
export const PWRC_REFERENCE_USD_MICROS_PER_TOKEN = 2n;
export const PWRC_MESSAGE_REFERENCE_USD_MICROS =
  PWRC_MESSAGE_COST_TOKENS * PWRC_REFERENCE_USD_MICROS_PER_TOKEN;
export const PWRC_PRICING_VERSION = "pwrc-copilot-v1" as const;

export const PWRC_DEMO_GRANT_TOKENS = 1_000_000n;
export const PWRC_DEMO_GRANT_BASE_UNITS =
  PWRC_DEMO_GRANT_TOKENS * PWRC_BASE_UNITS_PER_TOKEN;

export const PWRC_FUNDING_PRESETS = [
  { pwrc: 500_000n, responses: 50 },
  { pwrc: 2_500_000n, responses: 250 },
  { pwrc: 5_000_000n, responses: 500 },
  { pwrc: 10_000_000n, responses: 1_000 },
] as const;
