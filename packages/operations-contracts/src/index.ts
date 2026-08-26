export type DataMode = 'live' | 'demo' | 'unavailable';
export type FreshnessState = 'fresh' | 'stale' | 'unknown';
export type OperationalStatus = 'operational' | 'degraded' | 'offline' | 'unknown';
export type NetworkName = 'solana' | 'sui';
export type AlarmSeverity = 'info' | 'warning' | 'critical';
export type AlarmState = 'open' | 'acknowledged' | 'resolved';
export type OperationalEventKind = 'telemetry' | 'device' | 'depin' | 'alarm' | 'action' | 'provider' | 'system';

export type SourceMetadata = {
  source: string;
  mode: DataMode;
  observedAt: string | null;
  receivedAt: string;
  freshness: FreshnessState;
  maxAgeSeconds?: number;
  sequence?: string | null;
};

export type Measurement = {
  value: string;
  unit: string;
};

export type EnergySiteSummary = {
  id: string;
  organizationId?: string | null;
  name: string;
  timezone: string;
  role: 'viewer' | 'operator' | 'approver' | 'admin' | string;
};

export type EmsOverview = {
  siteId: string;
  status: OperationalStatus;
  generation: Measurement;
  load: Measurement;
  storagePower: Measurement;
  gridExchange: Measurement;
  batterySocPercent: string | null;
  frequencyHz: string | null;
  source: SourceMetadata;
};

export type IotDevice = {
  id: string;
  siteId: string;
  kind: 'meter' | 'inverter' | 'battery' | 'charger' | 'sensor' | 'gateway' | 'other';
  label: string;
  status: OperationalStatus;
  lastSeenAt: string | null;
  firmware?: string | null;
  source: SourceMetadata;
};

export type DepinNode = {
  id: string;
  network: string;
  siteId?: string | null;
  status: OperationalStatus;
  peerId?: string | null;
  endpoint?: string | null;
  lastHeartbeatAt: string | null;
  source: SourceMetadata;
};

export type MarketPrice = {
  symbol: string;
  price: string;
  currency: string;
  provider: string;
  observedAt: string | null;
  source: SourceMetadata;
};

export type OperationalAlarm = {
  id: string;
  siteId: string;
  resourceId?: string | null;
  code: string;
  title: string;
  detail?: string | null;
  severity: AlarmSeverity;
  state: AlarmState;
  openedAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  source: SourceMetadata;
};

export type OperationalEvent = {
  id: string;
  siteId?: string | null;
  resourceId?: string | null;
  kind: OperationalEventKind;
  type: string;
  summary: string;
  actorType: 'system' | 'provider' | 'user';
  actorId?: string | null;
  occurredAt: string;
  source: SourceMetadata;
  metadata?: Record<string, string | number | boolean | null>;
};

export type OperationalTwin = {
  siteId: string;
  status: OperationalStatus;
  telemetry: {
    generationKw: string | null;
    loadKw: string | null;
    gridExchangeKw: string | null;
    batterySocPercent: string | null;
    frequencyHz: string | null;
  };
  assets: {
    iotTotal: number;
    iotOperational: number;
    depinTotal: number;
    depinOperational: number;
  };
  alarms: {
    open: number;
    critical: number;
  };
  computedAt: string;
  sourceFreshness: FreshnessState;
};


export type TelemetryIntegrityReport = {
  siteId: string;
  state: 'healthy' | 'degraded' | 'insufficient_data';
  freshness: FreshnessState;
  observedAt: string | null;
  computedAt: string;
  checks: Array<{
    name: 'telemetry_freshness' | 'iot_availability' | 'depin_availability' | 'critical_alarms';
    status: 'ok' | 'warning' | 'failed' | 'unknown';
    detail: string;
  }>;
};

export type WalletIdentity = {
  id: string;
  address: string;
  network: NetworkName;
  label?: string;
  isPrimary: boolean;
};

export type AuthPrincipal = {
  userId: string;
  organizationId?: string | null;
  sessionId?: string | null;
  roles: string[];
};

export type HealthCheck = {
  name: string;
  status: 'ok' | 'degraded' | 'down' | 'not_configured';
  latencyMs?: number;
  detail?: string;
};

export type ApiHealth = {
  status: 'ok' | 'degraded' | 'not_ready';
  service: string;
  version: '1.0.0';
  checks: HealthCheck[];
  generatedAt: string;
};

export type PublicRuntimeConfig = {
  version: '1.0.0';
  dataMode: DataMode;
  aiMode: string;
  networks: {
    solana: { cluster: string; provider: 'public' | 'helius' | 'custom'; commitment: string };
    sui: { network: string };
  };
  features: {
    ems: boolean;
    iot: boolean;
    depin: boolean;
    marketData: boolean;
    safeActions: boolean;
    alarms?: boolean;
    events?: boolean;
    digitalTwin?: boolean;
  };
  safety?: {
    physicalExecution: false;
    blockchainExecution: false;
    signing: 'client_wallet_only';
    safeActions: 'prepare_only';
  };
  limits?: {
    pageSizeDefault: number;
    pageSizeMax: number;
    ingestBatchMax: number;
  };
};

export type PageInfo = {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
};

export type Paginated<T> = {
  items: T[];
  page: PageInfo;
};

export const SAFE_ACTION_TYPES = [
  'ems.dispatch.prepare',
  'iot.device.refresh',
  'depin.node.refresh',
  'alarm.acknowledge.prepare',
  'wallet.signature.prepare',
  'settlement.prepare',
] as const;

export type SafeActionType = (typeof SAFE_ACTION_TYPES)[number];
export type SafeActionRisk = 'read_only' | 'review_required' | 'wallet_signature_required';

export type SafeActionRequest = {
  action: SafeActionType;
  resourceId: string;
  reason: string;
  idempotencyKey: string;
  parameters?: Record<string, unknown>;
};

export type SafeActionDecision = {
  requestId: string;
  action: SafeActionType;
  risk: SafeActionRisk;
  status: 'prepared' | 'rejected' | 'expired';
  requiresHumanApproval: boolean;
  requiresWalletSignature: boolean;
  expiresAt: string;
  simulation?: Record<string, unknown>;
  policyReasons: string[];
};

export type EmsIngestRecord = {
  siteId: string;
  source: string;
  mode: DataMode;
  status: OperationalStatus;
  generationKw: string;
  loadKw: string;
  storagePowerKw: string;
  gridExchangeKw: string;
  batterySocPercent?: string | null;
  frequencyHz?: string | null;
  observedAt: string;
  sequence?: string | null;
};

export type IotHeartbeatRecord = {
  id: string;
  siteId: string;
  kind: IotDevice['kind'];
  label: string;
  status: OperationalStatus;
  firmware?: string | null;
  source: string;
  mode: DataMode;
  observedAt: string;
  sequence?: string | null;
};

export type DepinHeartbeatRecord = {
  id: string;
  siteId?: string | null;
  network: string;
  status: OperationalStatus;
  peerId?: string | null;
  endpoint?: string | null;
  source: string;
  mode: DataMode;
  observedAt: string;
  sequence?: string | null;
};

export type AlarmIngestRecord = {
  id: string;
  siteId: string;
  resourceId?: string | null;
  code: string;
  title: string;
  detail?: string | null;
  severity: AlarmSeverity;
  state: AlarmState;
  source: string;
  mode: DataMode;
  observedAt: string;
  openedAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
};

export type IngestEnvelope<T> = {
  idempotencyKey: string;
  records: T[];
};

export type IngestResult = {
  accepted: number;
  duplicated: boolean;
  receiptId: string;
  receivedAt: string;
};

export const SAFE_ACTION_POLICY: Record<SafeActionType, SafeActionRisk> = {
  'ems.dispatch.prepare': 'review_required',
  'iot.device.refresh': 'read_only',
  'depin.node.refresh': 'read_only',
  'alarm.acknowledge.prepare': 'review_required',
  'wallet.signature.prepare': 'wallet_signature_required',
  'settlement.prepare': 'wallet_signature_required',
};

export function classifySafeAction(action: SafeActionType): SafeActionRisk {
  return SAFE_ACTION_POLICY[action];
}

export function assertSafeActionRequest(value: SafeActionRequest) {
  if (!value || typeof value !== 'object') throw new Error('Safe action request is required.');
  if (!SAFE_ACTION_TYPES.includes(value.action)) throw new Error('Unsupported safe action.');
  if (!value.resourceId?.trim()) throw new Error('resourceId is required.');
  if (value.resourceId.length > 256) throw new Error('resourceId must be 256 characters or fewer.');
  if (!value.reason?.trim()) throw new Error('reason is required.');
  if (value.reason.length > 500) throw new Error('reason must be 500 characters or fewer.');
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(value.idempotencyKey)) throw new Error('Invalid idempotencyKey.');
  if (value.parameters && (Array.isArray(value.parameters) || typeof value.parameters !== 'object')) throw new Error('parameters must be an object.');
  const encoded = JSON.stringify(value.parameters ?? {});
  if (utf8Length(encoded) > 16 * 1024) throw new Error('parameters exceed 16 KiB.');
}

export function parsePageLimit(value: unknown, fallback = 50, max = 200) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(String(value));
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) throw new Error(`limit must be an integer between 1 and ${max}.`);
  return parsed;
}

export function assertCursor(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.length > 256 || !/^[A-Za-z0-9._:-]+$/.test(value)) throw new Error('Invalid cursor.');
  return value;
}

export function assertIngestEnvelope<T>(value: IngestEnvelope<T>, maxBatch = 100): asserts value is IngestEnvelope<T> {
  if (!value || typeof value !== 'object') throw new Error('Ingest body is required.');
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(value.idempotencyKey ?? '')) throw new Error('Invalid idempotencyKey.');
  if (!Array.isArray(value.records) || value.records.length < 1 || value.records.length > maxBatch) throw new Error(`records must contain between 1 and ${maxBatch} items.`);
  if (utf8Length(JSON.stringify(value.records)) > 256 * 1024) throw new Error('records exceed 256 KiB.');
}

export function assertIsoTimestamp(value: string, field = 'observedAt') {
  if (typeof value !== 'string' || value.length > 64) throw new Error(`${field} must be an ISO timestamp.`);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be an ISO timestamp.`);
  const futureSkewMs = parsed - Date.now();
  if (futureSkewMs > 5 * 60_000) throw new Error(`${field} cannot be more than 5 minutes in the future.`);
}

export function assertDecimalString(value: string, field: string, maxScale = 9) {
  if (typeof value !== 'string' || !new RegExp(`^-?\\d+(?:\\.\\d{1,${maxScale}})?$`).test(value)) {
    throw new Error(`${field} must be a decimal string with at most ${maxScale} fractional digits.`);
  }
  if (value.length > 48) throw new Error(`${field} is too large.`);
}

export function assertEmsIngestRecord(value: EmsIngestRecord) {
  if (!value.siteId?.trim()) throw new Error('siteId is required.');
  if (!value.source?.trim() || value.source.length > 128) throw new Error('source is required and must be <= 128 characters.');
  if (!['live', 'demo', 'unavailable'].includes(value.mode)) throw new Error('Invalid data mode.');
  if (!['operational', 'degraded', 'offline', 'unknown'].includes(value.status)) throw new Error('Invalid operational status.');
  assertDecimalString(value.generationKw, 'generationKw', 6);
  assertDecimalString(value.loadKw, 'loadKw', 6);
  assertDecimalString(value.storagePowerKw, 'storagePowerKw', 6);
  assertDecimalString(value.gridExchangeKw, 'gridExchangeKw', 6);
  if (value.batterySocPercent != null) assertDecimalString(value.batterySocPercent, 'batterySocPercent', 4);
  if (value.frequencyHz != null) assertDecimalString(value.frequencyHz, 'frequencyHz', 4);
  assertIsoTimestamp(value.observedAt);
}

export function assertIotHeartbeatRecord(value: IotHeartbeatRecord) {
  if (!value.id?.trim() || !value.siteId?.trim()) throw new Error('id and siteId are required.');
  if (!['meter', 'inverter', 'battery', 'charger', 'sensor', 'gateway', 'other'].includes(value.kind)) throw new Error('Invalid IoT device kind.');
  if (!value.label?.trim() || value.label.length > 160) throw new Error('label is required and must be <= 160 characters.');
  if (!value.source?.trim() || value.source.length > 128) throw new Error('source is required and must be <= 128 characters.');
  assertIsoTimestamp(value.observedAt);
}

export function assertDepinHeartbeatRecord(value: DepinHeartbeatRecord) {
  if (!value.id?.trim() || !value.network?.trim()) throw new Error('id and network are required.');
  if (!value.source?.trim() || value.source.length > 128) throw new Error('source is required and must be <= 128 characters.');
  if (value.endpoint && value.endpoint.length > 512) throw new Error('endpoint must be <= 512 characters.');
  assertIsoTimestamp(value.observedAt);
}

export function assertAlarmIngestRecord(value: AlarmIngestRecord) {
  if (!value.id?.trim() || !value.siteId?.trim()) throw new Error('id and siteId are required.');
  if (!value.code?.trim() || value.code.length > 128) throw new Error('code is required and must be <= 128 characters.');
  if (!value.title?.trim() || value.title.length > 200) throw new Error('title is required and must be <= 200 characters.');
  if (value.detail && value.detail.length > 2_000) throw new Error('detail must be <= 2000 characters.');
  if (!['info', 'warning', 'critical'].includes(value.severity)) throw new Error('Invalid alarm severity.');
  if (!['open', 'acknowledged', 'resolved'].includes(value.state)) throw new Error('Invalid alarm state.');
  if (!value.source?.trim() || value.source.length > 128) throw new Error('source is required and must be <= 128 characters.');
  assertIsoTimestamp(value.observedAt);
  assertIsoTimestamp(value.openedAt, 'openedAt');
  if (value.acknowledgedAt) assertIsoTimestamp(value.acknowledgedAt, 'acknowledgedAt');
  if (value.resolvedAt) assertIsoTimestamp(value.resolvedAt, 'resolvedAt');
}

function utf8Length(value: string) {
  let byteLength = 0;
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    byteLength += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return byteLength;
}
