import { operationalError } from "./operational-error.js";

export function decimalToScaledInt(value: string, scale = 9): bigint {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) throw operationalError("INVALID_DECIMAL_STRING", 400, `Invalid decimal string: ${value}`);
  const [, sign, whole, frac = ""] = match;
  if (frac.length > scale) throw operationalError("DECIMAL_SCALE_EXCEEDED", 400, `Maximum scale is ${scale}.`);
  const n = BigInt(whole) * 10n ** BigInt(scale) + BigInt((frac + "0".repeat(scale)).slice(0, scale));
  return sign === "-" ? -n : n;
}

export function scaledIntToDecimal(value: bigint, scale = 9): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const base = 10n ** BigInt(scale);
  const whole = absolute / base;
  const fraction = (absolute % base).toString().padStart(scale, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function absBigInt(value: bigint) { return value < 0n ? -value : value; }
