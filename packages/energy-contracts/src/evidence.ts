import type { IsoTimestamp } from "./common.ts";

export type EvidenceTruthTier = "T0" | "T1" | "T2" | "T3" | "T4";
export type EvidenceValidationState =
  | "unverified"
  | "source_referenced"
  | "source_validated"
  | "corroborated"
  | "first_party_verified"
  | "discrepancy";

export interface EvidenceEnvelope<TPayload = Record<string, unknown>> {
  schemaVersion: "1.0.0";
  id: string;
  organizationId: string;
  siteId: string;
  kind: string;
  classification: "public" | "internal" | "confidential" | "restricted";
  source: string;
  truthTier: EvidenceTruthTier;
  validationState: EvidenceValidationState;
  contentHash: string;
  observedAt: IsoTimestamp;
  receivedAt: IsoTimestamp;
  payload: TPayload;
  authoritative: boolean;
  label: "live" | "simulation" | "non_authoritative";
}

export interface JsonEvidenceExport {
  exportVersion: "1.0.0";
  exportedAt: IsoTimestamp;
  organizationId: string;
  siteId: string;
  evidence: EvidenceEnvelope[];
}
