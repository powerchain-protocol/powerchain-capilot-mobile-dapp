import type { IsoTimestamp, PageMeta } from "./common.ts";

export type AlarmSeverity = "info" | "warning" | "critical";
export type AlarmStatus = "open" | "acknowledged" | "resolved";

export interface OperationalAlarm {
  id: string;
  organizationId: string;
  siteId: string;
  sourceType: "ems" | "iot" | "depin" | "grid" | "system";
  sourceId?: string;
  code: string;
  title: string;
  message: string;
  severity: AlarmSeverity;
  status: AlarmStatus;
  observedAt: IsoTimestamp;
  receivedAt: IsoTimestamp;
  payloadHash: string;
  acknowledgedAt?: IsoTimestamp;
  acknowledgedBy?: string;
  resolvedAt?: IsoTimestamp;
  resolvedBy?: string;
}

export interface AlarmPage {
  items: OperationalAlarm[];
  page: PageMeta;
}
