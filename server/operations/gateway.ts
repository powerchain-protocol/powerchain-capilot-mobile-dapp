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
  TelemetryIntegrityReport,
  PageInfo,
  PublicRuntimeConfig,
  SafeActionDecision,
  SafeActionRequest,
} from '../../packages/operations-contracts/src/index.ts';

export class OperationsGatewayError extends Error {
  constructor(message: string, readonly status = 502, readonly code = 'OPERATIONS_BACKEND_ERROR', readonly requestId?: string) {
    super(message);
    this.name = 'OperationsGatewayError';
  }
}

function qs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') search.set(key, String(value));
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export class OperationsGatewayClient {
  constructor(private readonly config: { baseUrl: string; bearerSecret: string; timeoutMs: number }) {}

  get configured() { return Boolean(this.config.baseUrl && this.config.bearerSecret); }

  async health(): Promise<ApiHealth> {
    if (!this.configured) {
      return {
        status: 'degraded',
        service: 'powerchain-operations-api',
        version: '1.0.0',
        checks: [{ name: 'operations-backend', status: 'not_configured' }],
        generatedAt: new Date().toISOString(),
      };
    }
    const started = Date.now();
    try {
      const response = await this.request<{ status: string; checks?: Array<{ name: string; status: string; latencyMs?: number; detail?: string }> }>('/health/ready', undefined, false);
      const checks = (response.checks ?? []).map((check) => ({
        name: check.name,
        status: check.status === 'ok' || check.status === 'degraded' || check.status === 'down' || check.status === 'not_configured' ? check.status : 'degraded',
        latencyMs: check.latencyMs,
        detail: check.detail,
      })) as ApiHealth['checks'];
      checks.unshift({ name: 'operations-backend', status: 'ok', latencyMs: Date.now() - started });
      return { status: response.status === 'ready' ? 'ok' : 'degraded', service: 'powerchain-operations-api', version: '1.0.0', checks, generatedAt: new Date().toISOString() };
    } catch (error) {
      return {
        status: 'degraded',
        service: 'powerchain-operations-api',
        version: '1.0.0',
        checks: [{ name: 'operations-backend', status: 'down', latencyMs: Date.now() - started, detail: error instanceof Error ? error.message : 'Operations backend unavailable.' }],
        generatedAt: new Date().toISOString(),
      };
    }
  }

  config(principal: { userId: string }) { return this.request<PublicRuntimeConfig>('/v1/config', principal); }
  sites(principal: { userId: string }) { return this.request<{ sites: EnergySiteSummary[]; requestId?: string }>('/v1/sites', principal); }
  emsOverview(principal: { userId: string }, siteId: string) { return this.request<{ overview: EmsOverview | null; requestId?: string }>(`/v1/ems/overview${qs({ siteId })}`, principal); }
  iotDevices(principal: { userId: string }, siteId: string, options: { cursor?: string; limit?: number } = {}) {
    return this.request<{ devices: IotDevice[]; page: PageInfo; requestId?: string }>(`/v1/iot/devices${qs({ siteId, cursor: options.cursor, limit: options.limit })}`, principal);
  }
  depinNodes(principal: { userId: string }, siteId: string, options: { cursor?: string; limit?: number } = {}) {
    return this.request<{ nodes: DepinNode[]; page: PageInfo; requestId?: string }>(`/v1/depin/nodes${qs({ siteId, cursor: options.cursor, limit: options.limit })}`, principal);
  }
  alarms(principal: { userId: string }, siteId: string, options: { state?: string; cursor?: string; limit?: number } = {}) {
    return this.request<{ alarms: OperationalAlarm[]; page: PageInfo; requestId?: string }>(`/v1/alarms${qs({ siteId, state: options.state, cursor: options.cursor, limit: options.limit })}`, principal);
  }
  events(principal: { userId: string }, siteId: string, options: { kind?: string; cursor?: string; limit?: number } = {}) {
    return this.request<{ events: OperationalEvent[]; page: PageInfo; requestId?: string }>(`/v1/events${qs({ siteId, kind: options.kind, cursor: options.cursor, limit: options.limit })}`, principal);
  }
  twin(principal: { userId: string }, siteId: string) { return this.request<{ twin: OperationalTwin; requestId?: string }>(`/v1/twin${qs({ siteId })}`, principal); }
  telemetryIntegrity(principal: { userId: string }, siteId: string) { return this.request<{ integrity: TelemetryIntegrityReport; requestId?: string }>(`/v1/telemetry/integrity${qs({ siteId })}`, principal); }
  marketPrices(principal: { userId: string }, symbols: string[]) { return this.request<{ prices: MarketPrice[]; requestId?: string }>(`/v1/market-data/prices${qs({ symbols: symbols.join(',') })}`, principal); }
  prepareAction(principal: { userId: string }, request: SafeActionRequest) {
    return this.request<{ decision: SafeActionDecision; requestId?: string }>('/v1/actions/prepare', principal, true, {
      method: 'POST',
      headers: { 'idempotency-key': request.idempotencyKey },
      body: JSON.stringify(request),
    });
  }

  private async request<T>(path: string, principal?: { userId: string }, includeInternalAuth = true, init: RequestInit = {}): Promise<T> {
    if (!this.configured) throw new OperationsGatewayError('Operations backend is not configured.', 503, 'OPERATIONS_NOT_CONFIGURED');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const headers = new Headers(init.headers);
      headers.set('accept', 'application/json');
      if (init.body !== undefined) headers.set('content-type', 'application/json');
      if (includeInternalAuth) headers.set('authorization', `Bearer ${this.config.bearerSecret}`);
      if (principal?.userId) headers.set('x-powerchain-user-id', principal.userId);
      const response = await fetch(`${this.config.baseUrl.replace(/\/+$/, '')}${path}`, { ...init, headers, signal: controller.signal, redirect: 'error' });
      const payload = await response.json().catch(() => null) as T | { error?: { code?: string; message?: string; requestId?: string } } | null;
      if (!response.ok) {
        const error = payload && typeof payload === 'object' && 'error' in payload ? payload.error : undefined;
        throw new OperationsGatewayError(error?.message || `Operations backend returned ${response.status}.`, response.status, error?.code || 'OPERATIONS_BACKEND_ERROR', error?.requestId);
      }
      return payload as T;
    } catch (error) {
      if (error instanceof OperationsGatewayError) throw error;
      if (error instanceof Error && error.name === 'AbortError') throw new OperationsGatewayError('Operations backend timed out.', 504, 'OPERATIONS_TIMEOUT');
      throw new OperationsGatewayError(error instanceof Error ? error.message : 'Operations backend request failed.');
    } finally {
      clearTimeout(timer);
    }
  }
}
