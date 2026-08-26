import { PWRC_BASE_UNITS_PER_TOKEN } from "@powerchain/pwrc-credits/constants";

export function formatPwrcBaseUnits(value: string) {
  if (!/^-?\d+$/.test(value)) return "—";
  const amount = BigInt(value);
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const whole = absolute / PWRC_BASE_UNITS_PER_TOKEN;
  const fraction = absolute % PWRC_BASE_UNITS_PER_TOKEN;
  const tail = fraction
    .toString()
    .padStart(9, "0")
    .replace(/0+$/, "");
  const wholeText = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${wholeText}${tail ? `.${tail}` : ""}`;
}

export function shortHash(value: string) {
  return value.length > 14 ? `${value.slice(0, 7)}…${value.slice(-5)}` : value;
}

export function formatPwrcTokens(value: string) {
  const [whole, fraction] = value.split(".");
  const sign = whole.startsWith("-") ? "-" : "";
  const digits = sign ? whole.slice(1) : whole;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${grouped}${fraction ? `.${fraction}` : ""}`;
}
