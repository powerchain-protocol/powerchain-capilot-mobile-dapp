import type { IsoTimestamp, PageMeta } from "./common.ts";
import type { AlarmSeverity } from "./alarms.ts";

export interface OperationalJournalEvent<TPayload = Record<string, unknown>> {
  id: string;
  organizationId: string;
  siteId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  severity: AlarmSeverity;
  source: string;
  sourceSequence?: string;
  payloadHash: string;
  payload: TPayload;
  observedAt: IsoTimestamp;
  receivedAt: IsoTimestamp;
  requestId: string;
  traceId: string;
}

export interface OperationalEventPage {
  items: OperationalJournalEvent[];
  page: PageMeta;
}
