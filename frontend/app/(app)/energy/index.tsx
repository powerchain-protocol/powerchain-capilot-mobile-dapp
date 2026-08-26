import { router } from "expo-router";
import { Text } from "react-native";
import { ScreenToolbar, ResponsiveGrid } from "../../../src/components/layout";
import { EmptyState, Screen, Section } from "../../../src/components/ui";
import { OperationalMetric } from "../../../src/components/operations";
import { APP_ROUTES } from "../../../src/constants/routes";
import { useEmsOverview } from "../../../src/hooks/useEmsOverview";
import { usePowerChainTheme } from "../../../src/theme";

export default function EnergyOverviewScreen() {
  const { theme } = usePowerChainTheme();
  const overview = useEmsOverview();

  return (
    <Screen>
      <ScreenToolbar
        eyebrow="Energy management system"
        title="Energy"
        description="Physical generation, demand, storage, grid exchange, forecast variance and flexibility with explicit units and freshness."
        badge={overview.data ? { label: overview.data.mode.toUpperCase(), tone: overview.data.mode === "live" ? "success" : "warning" } : undefined}
        actions={[
          { label: "Live flow", icon: "transmission-tower", onPress: () => router.push(APP_ROUTES.energyFlow as never), variant: "primary" },
          { label: "IoT devices", icon: "access-point", onPress: () => router.push(APP_ROUTES.iot as never) },
          { label: "DePIN", icon: "hubspot", onPress: () => router.push(APP_ROUTES.depin as never) },
        ]}
      />

      {overview.data ? (
        <>
          <Section title="Current state" description={`Updated ${new Date(overview.data.updatedAt).toLocaleString()}`}>
            <ResponsiveGrid minItemWidth={190}>
              <OperationalMetric label="Demand" value={`${overview.data.demand.value} ${overview.data.demand.unit}`} />
              <OperationalMetric label="Generation" value={`${overview.data.generation.value} ${overview.data.generation.unit}`} />
              <OperationalMetric label="Storage SOC" value={`${overview.data.storageSoc.value}${overview.data.storageSoc.unit}`} />
              <OperationalMetric label={`Grid ${overview.data.gridDirection}`} value={`${overview.data.gridExchange.value} ${overview.data.gridExchange.unit}`} />
              <OperationalMetric label="Forecast deviation" value={`${overview.data.forecastDeviationPct}%`} />
              <OperationalMetric label="Flexibility" value={`${overview.data.flexibilityAvailable.value} ${overview.data.flexibilityAvailable.unit}`} />
            </ResponsiveGrid>
          </Section>
          <Section title="Trust boundary">
            <Text style={{ fontSize: 13, lineHeight: 19, color: theme.colors.textMuted }}>
              EMS values remain physical-system state. Copilot, MCP, market data and blockchain settlement may analyze or coordinate around this state, but do not silently replace telemetry truth.
            </Text>
          </Section>
        </>
      ) : overview.loading ? (
        <Section><Text style={{ color: theme.colors.textMuted }}>Loading EMS state…</Text></Section>
      ) : (
        <EmptyState
          title="EMS data unavailable"
          description={overview.error?.message ?? "No authoritative energy telemetry is available for this organization."}
          actionLabel="Retry"
          onAction={() => void overview.refresh()}
        />
      )}
    </Screen>
  );
}
