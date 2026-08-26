import { mobileEnv } from "../config/env";

export type ActionCenterItem = {
  id: string;
  category: "approval" | "settlement" | "evidence" | "health" | "information";
  title: string;
  summary: string;
  status: "needs_review" | "blocked" | "ready" | "informational";
  risk: "low" | "medium" | "high";
  dueLabel: string;
  assetId?: string;
  route: string;
};

export type OperationalAsset = {
  id: string;
  name: string;
  technology: "Solar" | "Wind" | "Battery" | "EV Charging";
  location: string;
  capacity: string;
  status: "operational" | "review" | "degraded";
  evidence: string;
  settlement: string;
  network: string;
};

export type ReportItem = {
  id: string;
  title: string;
  scope: string;
  period: string;
  status: "ready" | "draft";
  updated: string;
};

export type SettlementReviewItem = {
  id: string;
  assetId: string;
  title: string;
  amount: string;
  asset: string;
  state: "approval_required" | "reconciling" | "ready";
  authority: string;
};

const actions: ActionCenterItem[] = [
  {
    id: "act-approval-001",
    category: "approval",
    title: "Approve delivery evidence",
    summary: "Meter evidence is complete; human approval is required before settlement preparation.",
    status: "needs_review",
    risk: "low",
    dueLabel: "Today",
    assetId: "pc-solar-001",
    route: "/(app)/approvals/batch",
  },
  {
    id: "act-settlement-002",
    category: "settlement",
    title: "Review settlement intent",
    summary: "A prepared settlement is waiting for operator review. Wallet authorization remains separate.",
    status: "needs_review",
    risk: "medium",
    dueLabel: "Today",
    assetId: "pc-battery-002",
    route: "/(app)/settlements/review",
  },
  {
    id: "act-evidence-003",
    category: "evidence",
    title: "Resolve evidence discrepancy",
    summary: "External analysis differs from first-party meter evidence. Physical evidence remains canonical.",
    status: "blocked",
    risk: "medium",
    dueLabel: "2d",
    assetId: "pc-wind-003",
    route: "/(app)/assets/pc-wind-003",
  },
  {
    id: "act-health-004",
    category: "health",
    title: "Inspect service health",
    summary: "Review provider, chain, database and MCP readiness from one operational surface.",
    status: "informational",
    risk: "low",
    dueLabel: "Now",
    route: "/(app)/service-health",
  },
];

const assets: OperationalAsset[] = [
  {
    id: "pc-solar-001",
    name: "North Ridge Solar",
    technology: "Solar",
    location: "Finland",
    capacity: "8.4 MW",
    status: "operational",
    evidence: "T4 meter evidence current",
    settlement: "1 item awaiting review",
    network: "Solana",
  },
  {
    id: "pc-battery-002",
    name: "Harbor BESS",
    technology: "Battery",
    location: "Finland",
    capacity: "12 MWh",
    status: "review",
    evidence: "T4 telemetry current",
    settlement: "Prepared intent",
    network: "Solana",
  },
  {
    id: "pc-wind-003",
    name: "West Coast Wind",
    technology: "Wind",
    location: "Finland",
    capacity: "24 MW",
    status: "degraded",
    evidence: "External discrepancy open",
    settlement: "Blocked by evidence review",
    network: "Sui + Solana",
  },
];

const reports: ReportItem[] = [
  { id: "rep-ops-daily", title: "Daily operations report", scope: "Fleet", period: "Today", status: "ready", updated: "5 min ago" },
  { id: "rep-rwa-evidence", title: "RWA evidence report", scope: "Renewable assets", period: "Current period", status: "ready", updated: "18 min ago" },
  { id: "rep-settlement", title: "Settlement control report", scope: "Treasury / settlement", period: "Today", status: "draft", updated: "2 min ago" },
];

const settlements: SettlementReviewItem[] = [
  { id: "set-2048", assetId: "pc-solar-001", title: "Delivered energy settlement", amount: "18.40", asset: "USDC", state: "approval_required", authority: "Human approval + wallet signature" },
  { id: "set-2049", assetId: "pc-battery-002", title: "Flexibility service settlement", amount: "9.75", asset: "USDC", state: "ready", authority: "Wallet signature required" },
  { id: "set-2050", assetId: "pc-wind-003", title: "Generation reconciliation", amount: "—", asset: "Evidence only", state: "reconciling", authority: "Blocked until evidence reconciles" },
];

export function demoEnabled() {
  return mobileEnv.dataMode === "demo";
}
export function getActionCenterDemo() { return demoEnabled() ? actions : []; }
export function getOperationalAssetsDemo() { return demoEnabled() ? assets : []; }
export function getOperationalAssetDemo(id: string) { return getOperationalAssetsDemo().find((asset) => asset.id === id); }
export function getReportsDemo() { return demoEnabled() ? reports : []; }
export function getSettlementReviewsDemo() { return demoEnabled() ? settlements : []; }
export function getActionCenterItemDemo(id: string) { return getActionCenterDemo().find((item) => item.id === id); }
