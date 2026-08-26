import type { EmsOverview, EnergyFlowSnapshot, EnergyValue, OperationalUnit } from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";
import { config } from "../config.js";
import { sourceMeta } from "../lib/freshness.js";
import { assertResourceSite } from "../auth/site-access.js";

const mode = (): EmsOverview["mode"] =>
  config.OPERATIONS_DATA_MODE === "demo"
    ? "simulation"
    : config.OPERATIONS_DATA_MODE as EmsOverview["mode"];

const metricSpec = {
  demand_mw: "MW",
  generation_mw: "MW",
  storage_soc_pct: "%",
  grid_exchange_mw: "MW",
  flexibility_mw: "MW",
  grid_frequency_hz: "Hz",
  forecast_deviation_pct: "%",
} as const satisfies Record<string, OperationalUnit>;

function unavailable(unit: OperationalUnit): EnergyValue {
  return { value: null, unit, availability: "unavailable" };
}

export async function getEmsOverview(
  organizationId: string,
  siteId: string,
): Promise<EmsOverview | null> {
  await assertResourceSite(organizationId, siteId);

  const devices = await prisma.iotDevice.findMany({
    where: { organizationId, siteId },
    select: { id: true },
  });
  if (!devices.length) return null;

  const readings = await prisma.telemetryReading.findMany({
    where: {
      organizationId,
      deviceId: { in: devices.map((device) => device.id) },
      metric: { in: Object.keys(metricSpec) },
    },
    orderBy: { observedAt: "desc" },
    take: 200,
  });
  if (!readings.length) return null;

  const latest = new Map<string, (typeof readings)[number]>();
  for (const row of readings) {
    if (!latest.has(row.metric)) latest.set(row.metric, row);
  }

  const reference =
    latest.get("generation_mw") ??
    latest.get("demand_mw") ??
    readings[0];

  const metric = (name: keyof typeof metricSpec): EnergyValue => {
    const row = latest.get(name);
    if (!row) return unavailable(metricSpec[name]);
    return {
      value: String(row.value),
      unit: metricSpec[name],
      availability: "available",
      source: sourceMeta(row.source, row.observedAt, row.receivedAt),
    };
  };

  const gridExchange = metric("grid_exchange_mw");
  const gridNumber =
    gridExchange.value == null ? Number.NaN : Number(gridExchange.value);

  return {
    siteId,
    mode: mode(),
    demand: metric("demand_mw"),
    generation: metric("generation_mw"),
    storageSoc: metric("storage_soc_pct"),
    gridExchange,
    gridFrequency: metric("grid_frequency_hz"),
    gridDirection: Number.isFinite(gridNumber)
      ? gridNumber > 0
        ? "export"
        : gridNumber < 0
          ? "import"
          : "balanced"
      : "unknown",
    forecastDeviationPct: metric("forecast_deviation_pct").value,
    flexibilityAvailable: metric("flexibility_mw"),
    updatedAt: reference.observedAt.toISOString(),
    source: sourceMeta(
      reference.source,
      reference.observedAt,
      reference.receivedAt,
    ),
  };
}

export async function getEnergyFlow(
  organizationId: string,
  siteId: string,
): Promise<EnergyFlowSnapshot | null> {
  const overview = await getEmsOverview(organizationId, siteId);
  if (!overview) return null;

  const nodes: EnergyFlowSnapshot["nodes"] = [
    {
      id: "generation",
      kind: "other",
      label: "Generation",
      power: overview.generation,
      status: overview.generation.availability === "available" ? "online" : "unknown",
    },
    {
      id: "load",
      kind: "load",
      label: "Demand",
      power: overview.demand,
      status: overview.demand.availability === "available" ? "online" : "unknown",
    },
    {
      id: "grid",
      kind: "grid",
      label: "Grid",
      power: overview.gridExchange,
      status: overview.gridExchange.availability === "available" ? "online" : "unknown",
    },
  ];

  const edges: EnergyFlowSnapshot["edges"] = [];
  if (
    overview.generation.value != null &&
    overview.demand.value != null
  ) {
    edges.push({
      from: "generation",
      to: "load",
      power: overview.demand,
      direction: "forward",
    });
  }

  const grid =
    overview.gridExchange.value == null
      ? Number.NaN
      : Number(overview.gridExchange.value);
  if (Number.isFinite(grid) && grid > 0) {
    edges.push({
      from: "generation",
      to: "grid",
      power: overview.gridExchange,
      direction: "forward",
    });
  }
  if (Number.isFinite(grid) && grid < 0) {
    edges.push({
      from: "grid",
      to: "load",
      power: {
        value: String(Math.abs(grid)),
        unit: "MW",
        availability: "available",
        source: overview.gridExchange.source,
      },
      direction: "forward",
    });
  }

  return {
    siteId,
    mode: overview.mode,
    nodes,
    edges,
    updatedAt: overview.updatedAt,
    source: overview.source,
  };
}
