import { PWRC_BASE_UNITS_PER_TOKEN } from '@/constants/pwrc';

const INTEGER_PATTERN = /^(0|[1-9]\d*)$/;

export function formatPwrcBaseUnits(value: string) {
  if (!INTEGER_PATTERN.test(value)) return '—';
  const units = BigInt(value);
  const whole = units / PWRC_BASE_UNITS_PER_TOKEN;
  const fraction = (units % PWRC_BASE_UNITS_PER_TOKEN).toString().padStart(9, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function formatPwrcCompact(value: string) {
  const exact = formatPwrcBaseUnits(value);
  if (exact === '—') return exact;
  const [whole] = exact.split('.');
  const numericWhole = BigInt(whole ?? '0');
  if (numericWhole >= 1_000_000n) return `${(numericWhole / 1_000_000n).toString()}M`;
  if (numericWhole >= 1_000n) return `${(numericWhole / 1_000n).toString()}K`;
  return exact;
}

export function pwrcWholeTokensToBaseUnits(value: bigint) {
  if (value < 0n) throw new RangeError('PWRC amount cannot be negative.');
  return (value * PWRC_BASE_UNITS_PER_TOKEN).toString();
}
