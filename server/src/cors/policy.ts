export type CorsPolicy = {
  allowedOrigins: Set<string>;
  allowCredentials: boolean;
  maxAgeSeconds: number;
};

function normalizeOrigin(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported CORS origin protocol: ${url.protocol}`);
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error(`CORS origin must be an origin only: ${value}`);
  return url.origin;
}

export function loadCorsPolicy(source: NodeJS.ProcessEnv = process.env): CorsPolicy {
  const production = (source.NODE_ENV || 'development') === 'production';
  const raw = (source.CORS_ALLOWED_ORIGINS || source.CORS_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  const allowedOrigins = new Set(raw.map(normalizeOrigin));
  const allowCredentials = (source.CORS_ALLOW_CREDENTIALS || 'true').trim().toLowerCase() !== 'false';
  const maxAgeSeconds = Math.min(86_400, Math.max(0, Number(source.CORS_MAX_AGE_SECONDS || 600) || 600));
  if (production && allowedOrigins.size === 0) throw new Error('CORS_ALLOWED_ORIGINS must be explicitly configured in production.');
  return { allowedOrigins, allowCredentials, maxAgeSeconds };
}

export function corsHeaders(origin: string | undefined, policy: CorsPolicy) {
  if (!origin) return {} as Record<string, string>;
  let normalized: string;
  try { normalized = new URL(origin).origin; } catch { return {}; }
  if (!policy.allowedOrigins.has(normalized)) return {};
  return {
    'access-control-allow-origin': normalized,
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type,idempotency-key,x-request-id',
    'access-control-expose-headers': 'x-request-id,retry-after',
    'access-control-max-age': String(policy.maxAgeSeconds),
    ...(policy.allowCredentials ? { 'access-control-allow-credentials': 'true' } : {}),
    vary: 'Origin',
  };
}
