import {
  PWRC_BASE_UNITS_PER_TOKEN,
  PWRC_DECIMALS,
  PWRC_MESSAGE_COST_BASE_UNITS,
} from "./constants.ts";

export type DecimalString = string;

const NON_NEGATIVE_INTEGER = /^(0|[1-9]\d*)$/;

export function parseBaseUnitString(value: string): bigint {
  if (!NON_NEGATIVE_INTEGER.test(value)) {
    throw new TypeError("PWRC base units must be a canonical non-negative integer string.");
  }
  return BigInt(value);
}

export function toBaseUnitString(value: bigint): DecimalString {
  if (value < 0n) {
    throw new RangeError("PWRC base units cannot be negative at an API boundary.");
  }
  return value.toString();
}

export function pwrcTokensToBaseUnits(tokens: bigint): bigint {
  if (tokens < 0n) throw new RangeError("PWRC token amount cannot be negative.");
  return tokens * PWRC_BASE_UNITS_PER_TOKEN;
}

export function formatPwrcBaseUnits(baseUnits: bigint): string {
  const negative = baseUnits < 0n;
  const absolute = negative ? -baseUnits : baseUnits;
  const whole = absolute / PWRC_BASE_UNITS_PER_TOKEN;
  const fraction = absolute % PWRC_BASE_UNITS_PER_TOKEN;
  const tail = fraction
    .toString()
    .padStart(PWRC_DECIMALS, "0")
    .replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${tail ? `.${tail}` : ""}`;
}

export function responseRunway(availableBaseUnits: bigint): bigint {
  if (availableBaseUnits <= 0n) return 0n;
  return availableBaseUnits / PWRC_MESSAGE_COST_BASE_UNITS;
}
