export class ProviderHttpError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number,
    message: string,
  ) {
    super(`${provider}: ${message}`);
    this.name = 'ProviderHttpError';
  }
}

export function joinApiUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, '');
  let normalizedPath = `/${path.replace(/^\/+/, '')}`;
  if (normalizedBase.endsWith('/v1') && normalizedPath.startsWith('/v1/')) normalizedPath = normalizedPath.slice(3);
  return `${normalizedBase}${normalizedPath}`;
}

export async function postJson<T>(input: {
  provider: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
  signal?: AbortSignal;
}): Promise<T> {
  const response = await fetch(input.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...input.headers },
    body: JSON.stringify(input.body),
    signal: input.signal,
    redirect: 'error',
  });
  const text = await response.text();
  if (!response.ok) {
    let detail = text.slice(0, 2_000);
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };
      detail = parsed.error?.message ?? parsed.message ?? detail;
    } catch {}
    throw new ProviderHttpError(input.provider, response.status, detail || `HTTP ${response.status}`);
  }
  return JSON.parse(text) as T;
}

export function parseToolArguments(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string' || !value.trim()) return {};
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Provider tool arguments must decode to a JSON object.');
  }
  return parsed as Record<string, unknown>;
}
