import type { IsoTimestamp, OperationalMode, SourceMeta } from "./common.ts";

export type OperationalUnit =
  | "W" | "kW" | "MW"
  | "Wh" | "kWh" | "MWh" | "GWh"
  | "%" | "Hz" | "V" | "kV" | "A" | "C";

export interface EnergyValue {
  value: string | null;
  unit: OperationalUnit;
  availability: "available" | "unavailable";
  source?: SourceMeta;
}

export interface EmsOverview {
  siteId: string;
  mode: OperationalMode;
  demand: EnergyValue;
  generation: EnergyValue;
  storageSoc: EnergyValue;
  gridExchange: EnergyValue;
  gridFrequency?: EnergyValue;
  gridDirection: "import" | "export" | "balanced" | "unknown";
  forecastDeviationPct: string | null;
  flexibilityAvailable: EnergyValue;
  updatedAt: IsoTimestamp;
  source: SourceMeta;
}

export interface EnergyFlowNode {
  id: string;
  kind: "solar" | "wind" | "storage" | "load" | "grid" | "hydro" | "other";
  label: string;
  power: EnergyValue;
  status: "online" | "offline" | "limited" | "unknown";
}

export interface EnergyFlowEdge {
  from: string;
  to: string;
  power: EnergyValue;
  direction: "forward" | "reverse";
}

export interface EnergyFlowSnapshot {
  siteId: string;
  mode: OperationalMode;
  nodes: EnergyFlowNode[];
  edges: EnergyFlowEdge[];
  balanceError?: EnergyValue;
  updatedAt: IsoTimestamp;
  source: SourceMeta;
}

export interface DispatchPreviewRequest {
  siteId: string;
  assetId: string;
  targetPowerMw: string;
  durationMinutes: number;
  mode: "charge" | "discharge" | "curtail" | "generate";
  reason: string;
  expectedResourceVersion?: number;
}

export interface DispatchPreview {
  previewId: string;
  siteId: string;
  assetId: string;
  targetPowerMw: string;
  durationMinutes: number;
  estimatedEnergyMwh: string;
  expectedRevenue?: { amount: string; currency: string };
  batterySocAfterPct?: string;
  gridImpact: "none" | "low" | "medium" | "high";
  policyDecision: "allowed" | "review_required" | "blocked";
  policyReasons: string[];
  expiresAt: IsoTimestamp;
}
