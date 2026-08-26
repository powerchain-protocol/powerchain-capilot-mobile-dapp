const SENSITIVE_KEYS = /(?:authorization|password|secret|token|api[-_]?key|private[-_]?key|seed|mnemonic|cookie)/i;

export function redactObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactObject);
  if (!value || typeof value !== 'object') return value;
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    output[key] = SENSITIVE_KEYS.test(key) ? '[REDACTED]' : redactObject(child);
  }
  return output;
}
