import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  IntegrationStatusCard,
} from "../../../src/components/integrations";
import {
  ResponsiveGrid,
} from "../../../src/components/layout";
import {
  EmptyState,
  Screen,
  Section,
} from "../../../src/components/ui";
import {
  getIntegrationStatus,
} from "../../../src/integrations/status";
import type {
  IntegrationSummary,
} from "../../../src/types/integrations";
import { useResponsiveLayout } from "../../../src/hooks/useResponsiveLayout";

export default function IntegrationsScreen() {
  const [status, setStatus] =
    useState<IntegrationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isMobile } = useResponsiveLayout();

  async function refresh() {
    setError(null);
    try {
      setStatus(await getIntegrationStatus());
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Status unavailable.",
      );
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <Screen>
      <View style={{ paddingTop: isMobile ? 12 : 24 }}>
        <Section
          title="Systems"
          description="Live PowerChain integration state."
        >
          {status?.items.length ? (
            <ResponsiveGrid minItemWidth={300}>
              {status.items.map((item) => (
                <IntegrationStatusCard
                  key={item.id}
                  integration={item}
                />
              ))}
            </ResponsiveGrid>
          ) : null}

          {!status && !error ? (
            <Text>Loading systems…</Text>
          ) : null}

          {error ? (
            <EmptyState
              title="Integration status unavailable"
              description={error}
              actionLabel="Retry"
              onAction={refresh}
            />
          ) : null}
        </Section>
      </View>
    </Screen>
  );
}
