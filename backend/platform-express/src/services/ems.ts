import type {
  DispatchPreview,
  DispatchPreviewRequest,
  EmsOverview,
  EnergyFlowSnapshot,
  SourceMeta,
} from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";
import { config } from "../config.js";

const now = () => new Date();
const sourceMeta = (source: string, observedAt: Date): SourceMeta => ({
  source,
  observedAt: observedAt.toISOString(),
  receivedAt: now().toISOString(),
  quality: "good",
});

function decimal(value: unknown): string {
  if (value == null) return "0";
  return String(value);
}

export async function getEmsOverview(organizationId: string): Promise<EmsOverview | null> {
  const readings = await prisma.telemetryReading.findMany({
    where: {
      organizationId,
      metric: { in: ["demand_mw", "generation_mw", "storage_soc_pct", "grid_exchange_mw", "flexibility_mw"] },
    },
    orderBy: { observedAt: "desc" },
    take: 50,
  });
  if (!readings.length) return null;

  const latest = new Map<string, typeof readings[number]>();
  for (const row of readings) if (!latest.has(row.metric)) latest.set(row.metric, row);
  const observedAt = [...latest.values()].map((row) => row.observedAt).sort((a,b) => b.getTime()-a.getTime())[0] ?? now();

  const demand = decimal(latest.get("demand_mw")?.value);
  const generation = decimal(latest.get("generation_mw")?.value);
  const storageSoc = decimal(latest.get("storage_soc_pct")?.value);
  const grid = decimal(latest.get("grid_exchange_mw")?.value);
  const flexibility = decimal(latest.get("flexibility_mw")?.value);
  const gridNumber = Number(grid);

  return {
    mode: config.ENERGY_DATA_MODE === "demo" ? "simulation" : (config.ENERGY_DATA_MODE as EmsOverview["mode"]),
    demand: { value: demand, unit: "MW" },
    generation: { value: generation, unit: "MW" },
    storageSoc: { value: storageSoc, unit: "%" },
    gridExchange: { value: grid, unit: "MW" },
    gridDirection: Number.isFinite(gridNumber) ? (gridNumber > 0 ? "export" : gridNumber < 0 ? "import" : "balanced") : "unknown",
    forecastDeviationPct: "0",
    flexibilityAvailable: { value: flexibility, unit: "MW" },
    updatedAt: observedAt.toISOString(),
    source: sourceMeta("postgres.telemetry", observedAt),
  };
}

export async function getEnergyFlow(organizationId: string): Promise<EnergyFlowSnapshot | null> {
  const overview = await getEmsOverview(organizationId);
  if (!overview) return null;

  const nodes = [
    { id: "generation", kind: "other" as const, label: "Generation", power: overview.generation, status: "online" as const },
    { id: "load", kind: "load" as const, label: "Demand", power: overview.demand, status: "online" as const },
    { id: "grid", kind: "grid" as const, label: "Grid", power: overview.gridExchange, status: "online" as const },
    { id: "storage", kind: "storage" as const, label: "Storage", power: { value: "0", unit: "MW" as const }, status: "unknown" as const },
  ];

  const edges = [
    { from: "generation", to: "load", power: overview.demand, direction: "forward" as const },
  ];

  const gridValue = Number(overview.gridExchange.value);
  if (Number.isFinite(gridValue) && gridValue > 0) {
    edges.push({ from: "generation", to: "grid", power: overview.gridExchange, direction: "forward" as const });
  } else if (Number.isFinite(gridValue) && gridValue < 0) {
    edges.push({ from: "grid", to: "load", power: { value: String(Math.abs(gridValue)), unit: "MW" }, direction: "forward" as const });
  }

  return {
    mode: overview.mode,
    nodes,
    edges,
    updatedAt: overview.updatedAt,
    source: overview.source,
  };
}

export function previewDispatch(request: DispatchPreviewRequest): DispatchPreview {
  const power = Number(request.targetPowerMw);
  const hours = request.durationMinutes / 60;
  const estimatedEnergy = Number.isFinite(power) ? power * hours : 0;
  const reasons: string[] = [];
  if (!Number.isFinite(power) || power <= 0) reasons.push("TARGET_POWER_INVALID");
  if (request.durationMinutes <= 0 || request.durationMinutes > 1440) reasons.push("DURATION_OUT_OF_RANGE");
  if (config.ENERGY_DATA_MODE === "maintenance") reasons.push("SYSTEM_MAINTENANCE");
  if (!config.ACTION_EXECUTION_ENABLED) reasons.push("EXTERNAL_EXECUTION_DISABLED");

  return {
    previewId: `dispatch_${crypto.randomUUID()}`,
    assetId: request.assetId,
    targetPowerMw: request.targetPowerMw,
    durationMinutes: request.durationMinutes,
    estimatedEnergyMwh: estimatedEnergy.toFixed(6),
    gridImpact: Math.abs(power) >= 10 ? "high" : Math.abs(power) >= 5 ? "medium" : "low",
    policyDecision: reasons.length ? "review_required" : "allowed",
    policyReasons: reasons,
    expiresAt: new Date(Date.now() + config.ACTION_CONFIRMATION_TTL_SECONDS * 1000).toISOString(),
  };
}
