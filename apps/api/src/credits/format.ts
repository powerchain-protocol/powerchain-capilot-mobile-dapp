import {
  formatPwrcBaseUnits as formatSharedPwrcBaseUnits,
  responseRunway as responseRunwayBigInt,
} from "@powerchain/pwrc-credits";

export function decimalToBigInt(
  value: { toString(): string } | string | bigint,
) {
  if (typeof value === "bigint") return value;
  const text = value.toString();
  if (!/^-?\d+$/.test(text)) {
    throw new TypeError("Database PWRC base units must be an integer decimal value.");
  }
  return BigInt(text);
}

export { pwrcTokensToBaseUnits } from "@powerchain/pwrc-credits";

export function formatPwrcBaseUnits(baseUnits: bigint) {
  return formatSharedPwrcBaseUnits(baseUnits);
}

export function formatUsdMicros(micros: bigint) {
  const negative = micros < 0n;
  const absolute = negative ? -micros : micros;
  const whole = absolute / 1_000_000n;
  const fraction = absolute % 1_000_000n;
  const fractionText = fraction
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fractionText ? `.${fractionText}` : ""}`;
}

export function responseRunway(availableBaseUnits: bigint) {
  const runway = responseRunwayBigInt(availableBaseUnits);
  return runway > BigInt(Number.MAX_SAFE_INTEGER)
    ? Number.MAX_SAFE_INTEGER
    : Number(runway);
}
