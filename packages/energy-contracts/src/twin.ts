import type { EmsOverview } from "./ems.ts";
import type { IsoTimestamp } from "./common.ts";

export interface HealthCountSummary {
  total: number;
  healthy: number;
  degraded: number;
  offline: number;
  unknown: number;
}

export interface AlarmCountSummary {
  open: number;
  acknowledged: number;
  resolved: number;
  criticalOpen: number;
}

export interface SiteDigitalTwin {
  schemaVersion: "1.0.0";
  organizationId: string;
  siteId: string;
  asOf: IsoTimestamp;
  operationalState: "healthy" | "degraded" | "critical" | "unknown";
  mode: "live" | "read_only" | "simulation" | "maintenance";
  authoritative: boolean;
  ems: EmsOverview | null;
  iot: HealthCountSummary;
  depin: HealthCountSummary;
  alarms: AlarmCountSummary;
  reasons: string[];
  sourceWatermarks: Record<string, { observedAt?: IsoTimestamp; receivedAt?: IsoTimestamp; sequence?: string }>;
}

export interface DigitalTwinExport {
  exportVersion: "1.0.0";
  exportedAt: IsoTimestamp;
  twin: SiteDigitalTwin;
  snapshotHash: string;
}
