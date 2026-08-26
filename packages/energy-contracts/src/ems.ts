import type { IsoTimestamp, OperationalMode, SourceMeta } from "./common.ts";

export interface EnergyValue {
  value: string;
  unit: "W" | "kW" | "MW" | "Wh" | "kWh" | "MWh" | "GWh" | "%";
}

export interface EmsOverview {
  mode: OperationalMode;
  demand: EnergyValue;
  generation: EnergyValue;
  storageSoc: EnergyValue;
  gridExchange: EnergyValue;
  gridDirection: "import" | "export" | "balanced" | "unknown";
  forecastDeviationPct: string;
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
  mode: OperationalMode;
  nodes: EnergyFlowNode[];
  edges: EnergyFlowEdge[];
  balanceError?: EnergyValue;
  updatedAt: IsoTimestamp;
  source: SourceMeta;
}

export interface DispatchPreviewRequest {
  assetId: string;
  targetPowerMw: string;
  durationMinutes: number;
  mode: "charge" | "discharge" | "curtail" | "generate";
  reason: string;
  expectedResourceVersion?: number;
}

export interface DispatchPreview {
  previewId: string;
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
