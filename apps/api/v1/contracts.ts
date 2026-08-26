export interface ApiV1ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
  requestId?: string;
}

export interface ApiV1HealthResponse {
  status: "ok" | "ready" | "degraded" | "unavailable";
  version?: string;
  timestamp?: string;
}
