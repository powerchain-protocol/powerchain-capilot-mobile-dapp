const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function assertSafeId(value: unknown, label = 'id'): string {
  if (typeof value !== 'string') throw new TypeError(`${label} must be a string.`);
  const normalized = value.trim();
  if (!SAFE_ID.test(normalized)) throw new TypeError(`${label} is invalid.`);
  return normalized;
}

export function createClientRequestId(prefix = 'req'): string {
  const random = Math.random().toString(36).slice(2, 12);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${random}`;
}
