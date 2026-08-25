import type { ChartDefinition } from "../types/charts";

export const copilotCharts: Record<string, ChartDefinition> = {
  generationToday: {
    id: "generation-today",
    title: "Generation today",
    description: "Verified renewable generation by source.",
    kind: "bar",
    valueFormat: "energy",
    series: [{ key: "value", label: "Generation", unit: "kWh" }],
    data: [
      { label: "Solar", value: 4280 },
      { label: "Wind", value: 3160 },
      { label: "Battery", value: 980 },
    ],
  },

  assetAvailability: {
    id: "asset-availability",
    title: "Asset availability",
    description: "Illustrative operational availability by asset.",
    kind: "bar",
    valueFormat: "percent",
    series: [{ key: "value", label: "Availability", unit: "%" }],
    data: [
      { label: "Solar", value: 0.98 },
      { label: "Wind", value: 0.94 },
      { label: "Battery", value: 0.99 },
    ],
  },
};

export function getCopilotChart(id: string) {
  return copilotCharts[id] ?? null;
}
