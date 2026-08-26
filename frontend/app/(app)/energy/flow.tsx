import { ScreenToolbar } from "../../../src/components/layout";
import { EmptyState, Screen, Section } from "../../../src/components/ui";
import { EnergyFlowCard } from "../../../src/components/operations";
import { useEnergyFlow } from "../../../src/hooks/useEmsOverview";

export default function EnergyFlowScreen() {
  const flow = useEnergyFlow();
  return (
    <Screen>
      <ScreenToolbar
        eyebrow="EMS"
        title="Live Flow"
        description="Directional physical energy flow with source identity, timestamp and data quality."
        actions={[{ label: "Refresh", icon: "refresh", onPress: () => void flow.refresh(), variant: "primary" }]}
      />
      <Section>
        {flow.data ? (
          <EnergyFlowCard flow={flow.data} />
        ) : (
          <EmptyState
            title={flow.loading ? "Loading energy flow" : "Energy flow unavailable"}
            description={flow.error?.message}
            actionLabel={!flow.loading ? "Retry" : undefined}
            onAction={!flow.loading ? () => void flow.refresh() : undefined}
          />
        )}
      </Section>
    </Screen>
  );
}
