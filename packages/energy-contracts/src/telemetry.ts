import type { FreshnessMeta, IsoTimestamp } from "./common.ts";

export type TelemetryIngestionStatus =
  | "accepted"
  | "duplicate"
  | "late"
  | "rejected";

export interface TelemetryIngestionInput {
  siteId: string;
  deviceId: string;
  source: string;
  sourceSequence: string;
  idempotencyKey: string;
  observedAt: IsoTimestamp;
  metric: string;
  value: string;
  unit: string;
  quality?: "GOOD" | "DEGRADED" | "BAD" | "UNKNOWN";
}

export interface TelemetryIngestionReceipt {
  receiptId: string;
  siteId: string;
  deviceId: string;
  idempotencyKey: string;
  source: string;
  sourceSequence: string;
  payloadHash: string;
  observedAt: IsoTimestamp;
  receivedAt: IsoTimestamp;
  status: TelemetryIngestionStatus;
  readingId?: string;
  reasonCode?: string;
}

export interface TelemetryIntegritySummary {
  source: string;
  latestSequence?: string;
  latestObservedAt?: IsoTimestamp;
  latestReceivedAt?: IsoTimestamp;
  freshness: FreshnessMeta;
  accepted: number;
  duplicates: number;
  late: number;
  rejected: number;
}
