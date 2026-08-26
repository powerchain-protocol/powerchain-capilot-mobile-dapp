import type { IsoTimestamp } from "./common.ts";

export type DispatchPreparationState =
  | "draft"
  | "simulated"
  | "review_required"
  | "prepared"
  | "rejected"
  | "expired";

export interface DispatchSimulationInput {
  siteId: string;
  assetId: string;
  targetPowerMw: string;
  durationMinutes: number;
  mode: "charge" | "discharge" | "curtail" | "generate";
  reason: string;
  expectedResourceVersion?: number;
}

export interface DispatchPreparation {
  id: string;
  state: DispatchPreparationState;
  simulation: true;
  authoritative: false;
  physicalExecutionEnabled: false;
  input: DispatchSimulationInput;
  expectedEnergyMwh: string;
  policyReasons: string[];
  requestHash: string;
  expiresAt: IsoTimestamp;
}
