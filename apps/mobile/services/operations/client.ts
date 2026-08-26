import { requestJson } from '@/lib/http';
import type {
  ApiHealth,
  DepinNode,
  EmsOverview,
  EnergySiteSummary,
  IotDevice,
  MarketPrice,
  OperationalAlarm,
  OperationalEvent,
  OperationalTwin,
  PageInfo,
  PublicRuntimeConfig,
  SafeActionDecision,
  SafeActionRequest,
  TelemetryIntegrityReport,
} from '@/types/operations';

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') search.set(key, String(value));
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export async function getApiHealth() {
  return requestJson<ApiHealth>('/api/v1/health');
}

export async function getPublicRuntimeConfig() {
  return requestJson<PublicRuntimeConfig>('/api/v1/config');
}

export async function getOperationalSites(accessToken: string) {
  return requestJson<{ sites: EnergySiteSummary[]; requestId?: string }>('/api/v1/sites', { authToken: accessToken });
}

export async function getEmsOverview(accessToken: string, siteId: string) {
  return requestJson<{ overview: EmsOverview | null; requestId?: string }>(`/api/v1/ems/overview${query({ siteId })}`, { authToken: accessToken });
}

export async function getIotDevices(accessToken: string, siteId: string, options: { cursor?: string; limit?: number } = {}) {
  return requestJson<{ devices: IotDevice[]; page: PageInfo; requestId?: string }>(`/api/v1/iot/devices${query({ siteId, cursor: options.cursor, limit: options.limit })}`, { authToken: accessToken });
}

export async function getDepinNodes(accessToken: string, siteId: string, options: { cursor?: string; limit?: number } = {}) {
  return requestJson<{ nodes: DepinNode[]; page: PageInfo; requestId?: string }>(`/api/v1/depin/nodes${query({ siteId, cursor: options.cursor, limit: options.limit })}`, { authToken: accessToken });
}

export async function getOperationalAlarms(accessToken: string, siteId: string, options: { state?: string; cursor?: string; limit?: number } = {}) {
  return requestJson<{ alarms: OperationalAlarm[]; page: PageInfo; requestId?: string }>(`/api/v1/alarms${query({ siteId, state: options.state, cursor: options.cursor, limit: options.limit })}`, { authToken: accessToken });
}

export async function getOperationalEvents(accessToken: string, siteId: string, options: { kind?: string; cursor?: string; limit?: number } = {}) {
  return requestJson<{ events: OperationalEvent[]; page: PageInfo; requestId?: string }>(`/api/v1/events${query({ siteId, kind: options.kind, cursor: options.cursor, limit: options.limit })}`, { authToken: accessToken });
}

export async function getOperationalTwin(accessToken: string, siteId: string) {
  return requestJson<{ twin: OperationalTwin; requestId?: string }>(`/api/v1/twin${query({ siteId })}`, { authToken: accessToken });
}

export async function getTelemetryIntegrity(accessToken: string, siteId: string) {
  return requestJson<{ integrity: TelemetryIntegrityReport; requestId?: string }>(`/api/v1/telemetry/integrity${query({ siteId })}`, { authToken: accessToken });
}

export async function getMarketPrices(accessToken: string, symbols: string[]) {
  const normalized = [...new Set(symbols.map((value) => value.trim().toUpperCase()).filter(Boolean))].slice(0, 20);
  return requestJson<{ prices: MarketPrice[]; requestId?: string }>(`/api/v1/market-data/prices${query({ symbols: normalized.join(',') })}`, { authToken: accessToken });
}

export async function prepareSafeAction(accessToken: string, request: SafeActionRequest) {
  return requestJson<{ decision: SafeActionDecision; requestId?: string }>('/api/v1/actions/prepare', {
    method: 'POST',
    authToken: accessToken,
    headers: { 'Idempotency-Key': request.idempotencyKey },
    body: request,
  });
}
