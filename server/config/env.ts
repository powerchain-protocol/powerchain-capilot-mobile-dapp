import type { AiProviderName } from '../../packages/ai-providers/types.ts';

function clean(value: string | undefined) { return value?.trim() || ''; }
function first(...values: Array<string | undefined>) {
  for (const value of values) {
    const normalized = clean(value);
    if (normalized) return normalized;
  }
  return '';
}
function bool(value: string | undefined, fallback: boolean) {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  throw new Error(`Invalid boolean value: ${value}`);
}
function int(value: string | undefined, fallback: number, min = 1, max = Number.MAX_SAFE_INTEGER) {
  if (!clean(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error(`Invalid integer value: ${value}`);
  return parsed;
}
function enumValue<T extends string>(value: string | undefined, fallback: T, allowed: readonly T[], label: string): T {
  const resolved = (clean(value) || fallback) as T;
  if (!allowed.includes(resolved)) throw new Error(`${label} must be one of: ${allowed.join(', ')}`);
  return resolved;
}
function csvProviders(value: string | undefined): AiProviderName[] {
  const allowed = new Set<AiProviderName>(['openai', 'anthropic', 'gemini', 'deepseek', 'ollama', 'llama', 'gridllm', 'emergent']);
  const values = (clean(value) || 'openai,anthropic,gemini,deepseek,ollama,gridllm').split(',').map((v) => v.trim()).filter(Boolean);
  const result: AiProviderName[] = [];
  for (const item of values) {
    if (!allowed.has(item as AiProviderName)) throw new Error(`Unsupported AI provider in AI_PROVIDER_ORDER: ${item}`);
    if (!result.includes(item as AiProviderName)) result.push(item as AiProviderName);
  }
  return result;
}

export function loadServerEnv(source: NodeJS.ProcessEnv = process.env) {
  const primary = enumValue(source.AI_PRIMARY_PROVIDER, 'openai' as const, ['openai', 'anthropic', 'gemini', 'deepseek', 'ollama', 'llama', 'gridllm', 'emergent'] as const, 'AI_PRIMARY_PROVIDER');
  const order = csvProviders(source.AI_PROVIDER_ORDER);
  const providerOrder = [primary, ...order.filter((name) => name !== primary)];
  const config = Object.freeze({
    nodeEnv: clean(source.NODE_ENV) || 'development',
    ai: {
      primaryProvider: primary,
      providerOrder,
      fallbackEnabled: bool(source.AI_FALLBACK_ENABLED, true),
      timeoutMs: int(first(source.AI_PROVIDER_TIMEOUT_MS, source.AI_REQUEST_TIMEOUT_MS), 60_000, 1_000, 300_000),
      maxOutputTokens: int(source.AI_MAX_OUTPUT_TOKENS, 4_096, 1, 131_072),
      reasoningEffort: clean(source.AI_REASONING_EFFORT) || 'medium',
      openai: {
        apiKey: clean(source.OPENAI_API_KEY),
        baseUrl: clean(source.OPENAI_BASE_URL) || 'https://api.openai.com',
        model: clean(source.OPENAI_MODEL) || 'gpt-5.6-terra',
      },
      anthropic: {
        apiKey: clean(source.ANTHROPIC_API_KEY),
        baseUrl: clean(source.ANTHROPIC_BASE_URL) || 'https://api.anthropic.com',
        model: clean(source.ANTHROPIC_MODEL),
        version: clean(source.ANTHROPIC_VERSION) || '2023-06-01',
      },
      gemini: {
        apiKey: clean(source.GEMINI_API_KEY),
        baseUrl: clean(source.GEMINI_BASE_URL) || 'https://generativelanguage.googleapis.com/v1beta/openai',
        model: clean(source.GEMINI_MODEL),
      },
      deepseek: {
        apiKey: clean(source.DEEPSEEK_API_KEY),
        baseUrl: clean(source.DEEPSEEK_BASE_URL) || 'https://api.deepseek.com',
        model: clean(source.DEEPSEEK_MODEL) || 'deepseek-v4-flash',
      },
      llama: {
        apiKey: clean(source.LLAMA_API_KEY) || 'local',
        baseUrl: clean(source.LLAMA_BASE_URL) || 'http://127.0.0.1:11434/v1',
        model: clean(source.LLAMA_MODEL),
      },
      ollama: {
        apiKey: clean(source.OLLAMA_API_KEY) || clean(source.LLAMA_API_KEY) || 'local',
        baseUrl: clean(source.OLLAMA_BASE_URL) || clean(source.LLAMA_BASE_URL) || 'http://127.0.0.1:11434/v1',
        model: clean(source.OLLAMA_MODEL) || clean(source.LLAMA_MODEL),
      },
      gridllm: {
        apiKey: clean(source.GRIDLLM_API_KEY),
        baseUrl: clean(source.GRIDLLM_BASE_URL),
        model: clean(source.GRIDLLM_MODEL),
      },
      emergent: {
        apiKey: clean(source.EMERGENT_LLM_KEY),
        baseUrl: clean(source.EMERGENT_LLM_BASE_URL),
        model: clean(source.EMERGENT_LLM_MODEL),
      },
    },
    database: {
      url: clean(source.DATABASE_URL),
      directUrl: clean(source.DIRECT_URL),
      mongoUrl: clean(source.MONGO_URL),
      mongoDbName: clean(source.MONGO_DB_NAME) || 'powerchain_copilot',
      redisUrl: clean(source.REDIS_URL),
    },
    auth: {
      tokenMode: enumValue(source.AUTH_TOKEN_MODE, 'opaque' as const, ['opaque', 'jwt'] as const, 'AUTH_TOKEN_MODE'),
      jwtSecret: clean(source.JWT_SECRET),
      sessionTtlDays: int(source.SESSION_TTL_DAYS, 30, 1, 365),
      settingsEncryptionKey: clean(source.SETTINGS_ENCRYPTION_KEY),
    },
    rateLimit: {
      store: enumValue(source.RATE_LIMIT_STORE, 'memory' as const, ['memory', 'redis'] as const, 'RATE_LIMIT_STORE'),
      globalLimit: int(first(source.GLOBAL_RATE_LIMIT, source.RATE_LIMIT_MAX), 300, 1, 100_000),
      globalWindowMs: int(first(source.GLOBAL_RATE_WINDOW_MS, source.RATE_LIMIT_WINDOW_MS), 60_000, 1_000, 86_400_000),
      authLimit: int(source.AUTH_RATE_LIMIT, 20, 1, 10_000),
      aiLimit: int(source.AI_RATE_LIMIT, 30, 1, 10_000),
      aiWindowMs: int(source.AI_RATE_WINDOW_MS, 60_000, 1_000, 86_400_000),
    },
    cors: {
      allowedOrigins: first(source.CORS_ALLOWED_ORIGINS, source.CORS_ORIGINS),
      allowCredentials: bool(source.CORS_ALLOW_CREDENTIALS, true),
      maxAgeSeconds: int(source.CORS_MAX_AGE_SECONDS, 600, 0, 86_400),
    },
    chat: {
      enabled: bool(source.CHAT_ENABLED, true),
      encryptionKey: clean(source.MESSAGE_ENCRYPTION_KEY) || clean(source.SETTINGS_ENCRYPTION_KEY),
      maxMessageChars: int(source.CHAT_MAX_MESSAGE_CHARS, 8_000, 256, 32_000),
      memoryEnabled: bool(source.AI_MEMORY_ENABLED, true),
    },
    payment: {
      solanaPayRecipient: clean(source.PWRC_SOLANA_PAY_RECIPIENT),
      kernelWebhookSecret: clean(source.PAYMENT_KERNEL_WEBHOOK_SECRET),
      receiptSigningPrivateKeyPem: clean(source.PWRC_RECEIPT_SIGNING_PRIVATE_KEY_PEM),
      receiptSigningKeyId: clean(source.PWRC_RECEIPT_SIGNING_KEY_ID),
      receiptAnchorEnabled: bool(source.PWRC_RECEIPT_ANCHOR_ENABLED, true),
      receiptAnchorBatchSize: int(source.PWRC_RECEIPT_ANCHOR_BATCH_SIZE, 128, 1, 2048),
    },
    operations: {
      backendUrl: clean(source.OPERATIONS_BACKEND_URL),
      bearerSecret: clean(source.OPERATIONS_BACKEND_BEARER_SECRET),
      timeoutMs: int(source.OPERATIONS_BACKEND_TIMEOUT_MS, 10_000, 1_000, 60_000),
      dataMode: enumValue(source.OPERATIONS_DATA_MODE, 'unavailable' as const, ['live', 'demo', 'unavailable'] as const, 'OPERATIONS_DATA_MODE'),
      pageSizeDefault: int(source.OPERATIONS_PAGE_SIZE_DEFAULT, 50, 1, 200),
      pageSizeMax: int(source.OPERATIONS_PAGE_SIZE_MAX, 200, 1, 500),
      ingestBatchMax: int(source.OPERATIONS_INGEST_BATCH_MAX, 100, 1, 500),
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
    },
  });
  if (config.auth.tokenMode === 'jwt' && Buffer.byteLength(config.auth.jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes when AUTH_TOKEN_MODE=jwt.');
  }
  if (config.rateLimit.store === 'redis' && !config.database.redisUrl) {
    throw new Error('REDIS_URL is required when RATE_LIMIT_STORE=redis.');
  }
  if (config.nodeEnv === 'production' && (!config.payment.receiptSigningPrivateKeyPem || !config.payment.receiptSigningKeyId)) {
    throw new Error('PWRC_RECEIPT_SIGNING_PRIVATE_KEY_PEM and PWRC_RECEIPT_SIGNING_KEY_ID are required in production.');
  }
  if (config.nodeEnv === 'production' && config.chat.enabled && Buffer.byteLength(config.chat.encryptionKey, 'utf8') < 32) {
    throw new Error('MESSAGE_ENCRYPTION_KEY or SETTINGS_ENCRYPTION_KEY must contain at least 32 bytes when CHAT_ENABLED=true in production.');
  }
  if (config.nodeEnv === 'production' && config.operations.backendUrl && Buffer.byteLength(config.operations.bearerSecret, 'utf8') < 32) {
    throw new Error('OPERATIONS_BACKEND_BEARER_SECRET must contain at least 32 bytes in production when OPERATIONS_BACKEND_URL is configured.');
  }
  if (config.operations.pageSizeDefault > config.operations.pageSizeMax) {
    throw new Error('OPERATIONS_PAGE_SIZE_DEFAULT cannot exceed OPERATIONS_PAGE_SIZE_MAX.');
  }
  return config;
}
