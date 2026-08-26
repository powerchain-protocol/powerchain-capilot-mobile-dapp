export type IsoTimestamp = string;
export type DataQuality = "good" | "degraded" | "stale" | "unknown";
export type OperationalMode = "live" | "read_only" | "simulation" | "maintenance";
export type HealthStatus = "healthy" | "degraded" | "unavailable" | "misconfigured";

export interface SourceMeta {
  source: string;
  observedAt: IsoTimestamp;
  receivedAt: IsoTimestamp;
  intervalSeconds?: number;
  quality: DataQuality;
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
    source?: SourceMeta;
    page?: PageMeta;
  };
}
