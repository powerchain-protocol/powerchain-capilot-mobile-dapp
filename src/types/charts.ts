export type ChartKind = "bar" | "line" | "pie" | "area";

export type ChartValue = number | null;

export type ChartDatum = {
  label: string;
  value: ChartValue;
  secondaryValue?: ChartValue;
  timestamp?: string;
};

export type ChartSeries = {
  key: string;
  label: string;
  unit?: string;
};

export type ChartDefinition = {
  id: string;
  title: string;
  description?: string;
  kind: ChartKind;
  series: ChartSeries[];
  data: ChartDatum[];
  valueFormat?: "number" | "compact" | "currency" | "percent" | "energy";
  currency?: string;
  emptyLabel?: string;
};

export type ChartCardProps = {
  chart: ChartDefinition;
  loading?: boolean;
  error?: string | null;
};
