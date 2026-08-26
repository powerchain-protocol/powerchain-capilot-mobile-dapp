import type { IsoTimestamp } from "./common.ts";

export type SafeActionType =
  | "ems.dispatch.prepare"
  | "iot.device.refresh"
  | "depin.node.refresh"
  | "alarm.acknowledge.prepare"
  | "wallet.signature.prepare"
  | "settlement.prepare";

export type SafeActionState =
  | "prepared"
  | "read_only"
  | "review_required"
  | "wallet_signature_required"
  | "rejected"
  | "expired";

export interface SafeActionIntent<TPayload = Record<string, unknown>> {
  id: string;
  type: SafeActionType;
  organizationId: string;
  actorId: string;
  siteId?: string;
  payload: TPayload;
  idempotencyKey: string;
  expectedResourceVersion?: number;
  requestId: string;
  traceId?: string;
  createdAt: IsoTimestamp;
}

export interface SafeActionPreview<TSummary = Record<string, unknown>> {
  previewId: string;
  intentId: string;
  type: SafeActionType;
  state: SafeActionState;
  summary: TSummary;
  policyReasons: string[];
  confirmationRequired: boolean;
  walletSignatureRequired: boolean;
  readOnly: boolean;
  intentHash: string;
  expiresAt: IsoTimestamp;
}

export interface SafeActionReceipt {
  actionId: string;
  intentId: string;
  type: SafeActionType;
  state: SafeActionState;
  updatedAt: IsoTimestamp;
}
