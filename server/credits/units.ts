import { PWRC_BASE_UNITS_PER_TOKEN, PWRC_DECIMALS } from './constants.ts';

const INTEGER_PATTERN = /^(0|[1-9]\d*)$/;

export function parseBaseUnits(value: string | bigint): bigint {
  if (typeof value === 'bigint') {
    if (value < 0n) throw new RangeError('PWRC base units cannot be negative.');
    return value;
  }

  if (!INTEGER_PATTERN.test(value)) {
    throw new TypeError('PWRC base units must be an unsigned base-10 integer string.');
  }

  return BigInt(value);
}

export function assertPositiveBaseUnits(value: string | bigint): bigint {
  const units = parseBaseUnits(value);
  if (units <= 0n) throw new RangeError('PWRC amount must be greater than zero.');
  return units;
}

export function pwrcToBaseUnits(wholePwrc: bigint): bigint {
  if (wholePwrc < 0n) throw new RangeError('PWRC amount cannot be negative.');
  return wholePwrc * PWRC_BASE_UNITS_PER_TOKEN;
}

export function formatPwrcBaseUnits(value: string | bigint, trim = true): string {
  const units = parseBaseUnits(value);
  const whole = units / PWRC_BASE_UNITS_PER_TOKEN;
  const fraction = (units % PWRC_BASE_UNITS_PER_TOKEN)
    .toString()
    .padStart(PWRC_DECIMALS, '0');

  if (!trim) return `${whole}.${fraction}`;
  const trimmed = fraction.replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

export function baseUnitsJson(value: bigint): string {
  return value.toString(10);
}

export function formatUsdMicroUnits(value: bigint): string {
  const negative = value < 0n;
  const units = negative ? -value : value;
  const whole = units / 1_000_000n;
  const fraction = (units % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

export function formatUsdMicroUnitsFixed(value: bigint, fractionDigits = 2): string {
  if (!Number.isSafeInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 6) {
    throw new RangeError('USD fraction digits must be an integer between 0 and 6.');
  }
  const negative = value < 0n;
  const units = negative ? -value : value;
  const scale = 10n ** BigInt(6 - fractionDigits);
  if (units % scale !== 0n) throw new RangeError('USD micro-unit value cannot be represented exactly at the requested precision.');
  const whole = units / 1_000_000n;
  if (fractionDigits === 0) return `${negative ? '-' : ''}${whole}`;
  const fraction = ((units % 1_000_000n) / scale).toString().padStart(fractionDigits, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}
