import { createHash } from "node:crypto";
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
} from "./constants.ts";

export const PWRC_QUOTE_SCHEMA_VERSION = "1.0.0" as const;
export const PWRC_QUOTE_KIND = "copilot.completed_response" as const;
export const PWRC_BILLING_TRIGGER = "delivery_acknowledged" as const;

export type PwrcQuoteIdentity = {
  network: "devnet" | "mainnet-beta";
  mint: string;
  tokenProgram: string;
};

export function canonicalJson(value: unknown): string {
  if (value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashQuotePayload(value: Record<string, unknown>): string {
  return createHash("sha256")
    .update(canonicalJson(value))
    .digest("hex");
}

function formatUsdMicros(micros: bigint): string {
  const whole = micros / 1_000_000n;
  const fraction = (micros % 1_000_000n)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""}`;
}

export function buildPwrcMessageQuote(
  identity: PwrcQuoteIdentity = {
    network: PWRC_NETWORK,
    mint: PWRC_MINT,
    tokenProgram: PWRC_TOKEN_2022_PROGRAM,
  },
) {
  const canonical = {
    quoteSchemaVersion: PWRC_QUOTE_SCHEMA_VERSION,
    quoteKind: PWRC_QUOTE_KIND,
    billingTrigger: PWRC_BILLING_TRIGGER,
    pricingVersion: PWRC_PRICING_VERSION,
    responseUnits: 1 as const,
    asset: PWRC_SYMBOL,
    network: identity.network,
    mint: identity.mint,
    tokenProgram: identity.tokenProgram,
    costTokens: PWRC_MESSAGE_COST_TOKENS.toString(),
    costBaseUnits: PWRC_MESSAGE_COST_BASE_UNITS.toString(),
    decimals: PWRC_DECIMALS,
    referenceUsdPerPwrc: formatUsdMicros(PWRC_REFERENCE_USD_MICROS_PER_TOKEN),
    referenceUsd: formatUsdMicros(PWRC_MESSAGE_REFERENCE_USD_MICROS),
    referenceUsdMicrosPerPwrc: PWRC_REFERENCE_USD_MICROS_PER_TOKEN.toString(),
    referenceUsdMicros: PWRC_MESSAGE_REFERENCE_USD_MICROS.toString(),
    referencePriceIsLive: false as const,
  };
  return { ...canonical, quoteHash: hashQuotePayload(canonical) };
}

export type PwrcMessageQuoteSnapshot = ReturnType<typeof buildPwrcMessageQuote>;

export function isPwrcMessageQuoteSnapshot(
  value: unknown,
): value is PwrcMessageQuoteSnapshot {
  if (!value || typeof value !== "object") return false;
  const quote = value as Partial<PwrcMessageQuoteSnapshot>;
  if (
    quote.quoteSchemaVersion !== PWRC_QUOTE_SCHEMA_VERSION ||
    quote.quoteKind !== PWRC_QUOTE_KIND ||
    quote.billingTrigger !== PWRC_BILLING_TRIGGER ||
    quote.asset !== PWRC_SYMBOL ||
    (quote.network !== "devnet" && quote.network !== "mainnet-beta") ||
    typeof quote.mint !== "string" ||
    quote.mint.length < 32 ||
    typeof quote.tokenProgram !== "string" ||
    quote.tokenProgram.length < 32 ||
    quote.decimals !== PWRC_DECIMALS ||
    quote.responseUnits !== 1 ||
    typeof quote.costTokens !== "string" ||
    typeof quote.costBaseUnits !== "string" ||
    typeof quote.referenceUsdPerPwrc !== "string" ||
    typeof quote.referenceUsd !== "string" ||
    typeof quote.referenceUsdMicrosPerPwrc !== "string" ||
    typeof quote.referenceUsdMicros !== "string" ||
    quote.referencePriceIsLive !== false ||
    typeof quote.pricingVersion !== "string" ||
    typeof quote.quoteHash !== "string" ||
    !/^[a-f0-9]{64}$/.test(quote.quoteHash)
  ) {
    return false;
  }

  const { quoteHash, ...payload } = quote as PwrcMessageQuoteSnapshot;
  return hashQuotePayload(payload) === quoteHash;
}
