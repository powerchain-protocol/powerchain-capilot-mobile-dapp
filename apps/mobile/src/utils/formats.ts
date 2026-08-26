const compactFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatCompact(value: number) {
  return compactFormatter.format(value);
}

export function formatPercent(value: number) {
  return percentFormatter.format(value);
}

export function formatCurrency(
  value: number,
  currency = "EUR",
  locale = "en-FI",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatEnergy(value: number) {
  const absolute = Math.abs(value);

  if (absolute >= 1_000_000) {
    return `${formatNumber(value / 1_000_000)} GWh`;
  }

  if (absolute >= 1_000) {
    return `${formatNumber(value / 1_000)} MWh`;
  }

  return `${formatNumber(value)} kWh`;
}

export function formatChartValue(
  value: number,
  format: "number" | "compact" | "currency" | "percent" | "energy" = "number",
  currency = "EUR",
) {
  switch (format) {
    case "compact":
      return formatCompact(value);
    case "currency":
      return formatCurrency(value, currency);
    case "percent":
      return formatPercent(value);
    case "energy":
      return formatEnergy(value);
    default:
      return formatNumber(value);
  }
}
