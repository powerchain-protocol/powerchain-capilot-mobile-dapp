import type { DataMode } from '@powerchain/operations-contracts';

function clean(value: string | undefined) { return value?.trim() || ''; }
function bool(value: string | undefined, fallback: boolean) {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  throw new Error(`Invalid boolean: ${value}`);
}
function int(value: string | undefined, fallback: number, min = 1, max = Number.MAX_SAFE_INTEGER) {
  const raw = clean(value);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error(`Invalid integer: ${value}`);
  return parsed;
}
function dataMode(value: string | undefined): DataMode {
  const resolved = clean(value) || 'unavailable';
  if (!['live', 'demo', 'unavailable'].includes(resolved)) throw new Error('OPERATIONS_DATA_MODE must be live, demo, or unavailable.');
  return resolved as DataMode;
}
function httpUrl(value: string, name: string, fallback = '') {
  const resolved = value || fallback;
  if (!resolved) return '';
  const url = new URL(resolved);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`${name} must use http or https.`);
  return url.toString().replace(/\/$/, '');
}

export function loadOperationsConfig(source: NodeJS.ProcessEnv = process.env) {
  const nodeEnv = clean(source.NODE_ENV) || 'development';
  const config = Object.freeze({
    nodeEnv,
    host: clean(source.OPERATIONS_API_HOST) || '127.0.0.1',
    port: int(source.OPERATIONS_API_PORT, 8092, 1, 65535),
    internalBearerSecret: clean(source.OPERATIONS_INTERNAL_BEARER_SECRET),
    dataMode: dataMode(source.OPERATIONS_DATA_MODE),
    features: {
      ems: bool(source.EMS_ENABLED, true),
      iot: bool(source.IOT_ENABLED, true),
      depin: bool(source.DEPIN_ENABLED, true),
      marketData: bool(source.MARKET_DATA_ENABLED, true),
      safeActions: bool(source.SAFE_ACTIONS_ENABLED, true),
      alarms: bool(source.ALARMS_ENABLED, true),
      events: bool(source.EVENTS_ENABLED, true),
      digitalTwin: bool(source.DIGITAL_TWIN_ENABLED, true),
    },
    databaseUrl: clean(source.DATABASE_URL),
    supabase: {
      url: clean(source.SUPABASE_URL),
      serviceRoleKey: clean(source.SUPABASE_SERVICE_ROLE_KEY),
    },
    solanaRpcUrl: httpUrl(clean(source.SOLANA_RPC_URL), 'SOLANA_RPC_URL', 'https://api.devnet.solana.com'),
    suiRpcUrl: httpUrl(clean(source.SUI_RPC_URL), 'SUI_RPC_URL', 'https://fullnode.devnet.sui.io:443'),
    marketData: {
      baseUrl: httpUrl(clean(source.MARKET_DATA_BASE_URL), 'MARKET_DATA_BASE_URL'),
      apiKey: clean(source.MARKET_DATA_API_KEY),
      apiKeyHeader: clean(source.MARKET_DATA_API_KEY_HEADER) || 'x-api-key',
    },
    freshness: {
      telemetrySeconds: int(source.TELEMETRY_FRESH_SECONDS, 120, 1, 86_400),
      iotSeconds: int(source.IOT_FRESH_SECONDS, 300, 1, 86_400),
      depinSeconds: int(source.DEPIN_FRESH_SECONDS, 300, 1, 86_400),
      alarmSeconds: int(source.ALARM_FRESH_SECONDS, 900, 1, 604_800),
      eventSeconds: int(source.EVENT_FRESH_SECONDS, 900, 1, 604_800),
    },
    limits: {
      pageSizeDefault: int(source.OPERATIONS_PAGE_SIZE_DEFAULT, 50, 1, 200),
      pageSizeMax: int(source.OPERATIONS_PAGE_SIZE_MAX, 200, 1, 500),
      ingestBatchMax: int(source.OPERATIONS_INGEST_BATCH_MAX, 100, 1, 500),
      providerTimeoutMs: int(source.OPERATIONS_PROVIDER_TIMEOUT_MS, 8_000, 250, 60_000),
      providerResponseMaxBytes: int(source.OPERATIONS_PROVIDER_RESPONSE_MAX_BYTES, 512 * 1024, 1024, 5 * 1024 * 1024),
    },
    safeActionTtlSeconds: int(source.SAFE_ACTION_TTL_SECONDS, 600, 30, 3_600),
  });

  if (config.limits.pageSizeDefault > config.limits.pageSizeMax) throw new Error('OPERATIONS_PAGE_SIZE_DEFAULT cannot exceed OPERATIONS_PAGE_SIZE_MAX.');
  if (nodeEnv === 'production' && Buffer.byteLength(config.internalBearerSecret, 'utf8') < 32) {
    throw new Error('OPERATIONS_INTERNAL_BEARER_SECRET must contain at least 32 characters in production.');
  }
  if (nodeEnv === 'production' && !config.databaseUrl) throw new Error('DATABASE_URL is required in production.');
  return config;
}
