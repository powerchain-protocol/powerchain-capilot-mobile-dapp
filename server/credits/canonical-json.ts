/**
 * RFC 8785/JCS-compatible canonical JSON for the billing payload domain.
 * Billing payloads deliberately use strings for bigint/timestamps and integers for counts,
 * avoiding floating-point edge cases while preserving deterministic key ordering.
 */
export type CanonicalJsonValue = null | boolean | string | number | CanonicalJsonValue[] | { [key: string]: CanonicalJsonValue };

export function canonicalizeJson(value: CanonicalJsonValue): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isSafeInteger(value)) throw new TypeError('Canonical billing JSON only permits safe integers.');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalizeJson).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalizeJson(value[key]!)}`).join(',')}}`;
}
