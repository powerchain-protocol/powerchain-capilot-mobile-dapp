export type IsoTimestamp = string;
export type FreshnessState = "fresh" | "aging" | "stale" | "unknown";
export interface FreshnessMeta {
  state: FreshnessState;
  ageSeconds?: number;
  freshForSeconds: number;
  staleAfterSeconds: number;
}

export type DataQuality = "good" | "degraded" | "stale" | "unknown";
export type OperationalMode = "live" | "read_only" | "simulation" | "maintenance";
export type HealthStatus = "healthy" | "degraded" | "unavailable" | "misconfigured" | "disabled";

export interface SourceMeta {
  source: string;
  observedAt: IsoTimestamp;
  receivedAt: IsoTimestamp;
  intervalSeconds?: number;
  quality: DataQuality;
  freshness?: FreshnessMeta;
}

export interface PageMeta {
  cursor?: string;
  nextCursor?: string;
  total?: number;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: {
    requestId?: string;
    traceId?: string;
    source?: SourceMeta;
    page?: PageMeta;
    schemaVersion?: "1.0.0";
  };
}
