import type { IsoTimestamp } from "./common.ts";

export type SafeActionType =
  | "ems.dispatch"
  | "iot.command"
  | "depin.node_action"
  | "wallet.transfer"
  | "settlement.review";

export type SafeActionState =
  | "draft"
  | "previewed"
  | "review_required"
  | "approved"
  | "executing"
  | "completed"
  | "rejected"
  | "unknown";

export interface SafeActionIntent<TPayload = Record<string, unknown>> {
  id: string;
  type: SafeActionType;
  organizationId: string;
  actorId: string;
  payload: TPayload;
  idempotencyKey: string;
  expectedResourceVersion?: number;
  requestId: string;
  createdAt: IsoTimestamp;
}

export interface SafeActionPreview<TSummary = Record<string, unknown>> {
  previewId: string;
  intentId: string;
  state: "previewed" | "review_required" | "rejected";
  summary: TSummary;
  policyReasons: string[];
  confirmationRequired: boolean;
  confirmationToken?: string;
  expiresAt: IsoTimestamp;
}

export interface SafeActionReceipt {
  actionId: string;
  intentId: string;
  state: SafeActionState;
  externalReference?: string;
  errorCode?: string;
  updatedAt: IsoTimestamp;
}
