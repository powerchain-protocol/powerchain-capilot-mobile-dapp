import { ScreenToolbar, ResponsiveGrid } from "../../src/components/layout";
import { EmptyState, Screen, Section } from "../../src/components/ui";
import { DepinNodeCard } from "../../src/components/operations";
import { useDepinNodes } from "../../src/hooks/useDepinNodes";

export default function DepinScreen() {
  const nodes = useDepinNodes();
  return (
    <Screen>
      <ScreenToolbar
        eyebrow="Infrastructure networks"
        title="DePIN"
        description="Registered physical-infrastructure nodes, identity references, heartbeat state and reward accounting."
        actions={[{ label: "Refresh", icon: "refresh", onPress: () => void nodes.refresh(), variant: "primary" }]}
      />
      <Section title="Nodes">
        {nodes.data?.length ? (
          <ResponsiveGrid minItemWidth={280}>
            {nodes.data.map((node) => <DepinNodeCard key={node.id} node={node} />)}
          </ResponsiveGrid>
        ) : (
          <EmptyState
            title={nodes.loading ? "Loading DePIN nodes" : "No DePIN nodes available"}
            description={nodes.error?.message ?? "No DePIN nodes are registered for this organization."}
            actionLabel={!nodes.loading ? "Retry" : undefined}
            onAction={!nodes.loading ? () => void nodes.refresh() : undefined}
          />
        )}
      </Section>
    </Screen>
  );
}
