import { env } from "../config/env";
import {
  buildPwrcMessageQuote as buildSharedPwrcMessageQuote,
  PWRC_BASE_UNITS_PER_TOKEN,
  PWRC_DECIMALS,
  PWRC_FUNDING_PRESETS,
  PWRC_MESSAGE_COST_BASE_UNITS,
  PWRC_MESSAGE_COST_TOKENS,
  PWRC_MESSAGE_REFERENCE_USD_MICROS,
  PWRC_PRICING_VERSION,
  PWRC_REFERENCE_USD_MICROS_PER_TOKEN,
} from "@powerchain/pwrc-credits";

export function buildPwrcMessageQuote() {
  return buildSharedPwrcMessageQuote({
    network: env.PWRC_CREDIT_NETWORK,
    mint: env.PWRC_MINT,
    tokenProgram: env.TOKEN_2022_PROGRAM,
  });
}
export type PwrcMessageQuote = ReturnType<typeof buildPwrcMessageQuote>;

export function getPwrcPricingView() {
  const quote = buildPwrcMessageQuote();
  const explorerUrl =
    env.PWRC_CREDIT_NETWORK === "mainnet-beta"
      ? `https://explorer.solana.com/address/${env.PWRC_MINT}`
      : `https://explorer.solana.com/address/${env.PWRC_MINT}?cluster=${env.PWRC_CREDIT_NETWORK}`;

  return {
    version: "1.0.0" as const,
    pricingVersion: PWRC_PRICING_VERSION,
    referencePrice: {
      usdPerPwrc: "0.000002",
      usdMicrosPerPwrc: PWRC_REFERENCE_USD_MICROS_PER_TOKEN.toString(),
      isLiveMarketPrice: false as const,
      label: "Initial/configured reference value",
    },
    completedResponse: {
      responseUnits: 1 as const,
      pwrc: PWRC_MESSAGE_COST_TOKENS.toString(),
      baseUnits: PWRC_MESSAGE_COST_BASE_UNITS.toString(),
      referenceUsd: "0.02",
      referenceUsdMicros: PWRC_MESSAGE_REFERENCE_USD_MICROS.toString(),
      quoteHash: quote.quoteHash,
    },
    referenceEconomics: [
      { responses: 1, pwrc: "10000", referenceUsd: "0.02" },
      { responses: 50, pwrc: "500000", referenceUsd: "1.00" },
      { responses: 250, pwrc: "2500000", referenceUsd: "5.00" },
      { responses: 500, pwrc: "5000000", referenceUsd: "10.00" },
      { responses: 1000, pwrc: "10000000", referenceUsd: "20.00" },
    ],
    presets: PWRC_FUNDING_PRESETS.map((preset) => ({
      responses: preset.responses,
      pwrc: preset.pwrc.toString(),
      baseUnits: (preset.pwrc * PWRC_BASE_UNITS_PER_TOKEN).toString(),
    })),
    token: {
      symbol: "PWRC" as const,
      decimals: PWRC_DECIMALS,
      mint: env.PWRC_MINT,
      tokenProgram: env.TOKEN_2022_PROGRAM,
      network: env.PWRC_CREDIT_NETWORK,
      explorerUrl,
    },
    topupsEnabled:
      env.PWRC_TOPUPS_ENABLED &&
      Boolean(env.PWRC_TREASURY_ADDRESS) &&
      Boolean(env.PAYMENT_KERNEL_WEBHOOK_SECRET),
    demoGrantEnabled:
      env.PWRC_DEMO_GRANT_ENABLED && env.NODE_ENV !== "production",
    lowCreditResponseThreshold: env.PWRC_LOW_CREDIT_RESPONSES,
  };
}
