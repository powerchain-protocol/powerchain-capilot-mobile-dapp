import { createHash } from 'node:crypto';

export function canonicalize(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(null);
}

export function sha256Canonical(value: unknown) {
  return createHash('sha256').update(canonicalize(value), 'utf8').digest('hex');
}
