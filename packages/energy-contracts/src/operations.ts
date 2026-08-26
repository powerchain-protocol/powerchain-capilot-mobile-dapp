import type { IsoTimestamp } from "./common.ts";

export interface OperationalCompatibilityManifest {
  applicationVersion: string;
  contractsVersion: string;
  databaseSchemaVersion: string;
  eventSchemaVersion: string;
  apiVersion: "v1";
}

export interface OperationalRequestContext {
  requestId: string;
  traceId: string;
  organizationId: string;
  userId: string;
  siteId?: string;
}

export interface SiteAccessGrant {
  organizationId: string;
  userId: string;
  siteId: string;
  role: "viewer" | "operator" | "manager" | "admin";
  permissions: string[];
  expiresAt?: IsoTimestamp;
}

export interface OperationalEvent<TPayload = Record<string, unknown>> {
  id: string;
  type: string;
  organizationId: string;
  siteId?: string;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number;
  payload: TPayload;
  requestId: string;
  traceId: string;
  schemaVersion: "1.0.0";
  occurredAt: IsoTimestamp;
}

export interface OperationalSiteSummary {
  id: string;
  name: string;
  country?: string;
  timezone?: string;
  role: SiteAccessGrant["role"];
  permissions: string[];
}
