import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text } from "react-native";
import { IntegrationStatusCard } from "../../../src/components/integrations";
import { ResponsiveGrid, ScreenToolbar } from "../../../src/components/layout";
import { EmptyState, Screen, Section } from "../../../src/components/ui";
import { getIntegrationStatus } from "../../../src/integrations/status";
import type { IntegrationSummary } from "../../../src/types/integrations";
import { APP_ROUTES } from "../../../src/constants/routes";

export default function IntegrationsScreen() {
  const [status, setStatus] = useState<IntegrationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try { setStatus(await getIntegrationStatus()); }
    catch (value) { setError(value instanceof Error ? value.message : "Status unavailable."); }
  }
  useEffect(() => { void refresh(); }, []);

  return (
    <Screen>
      <ScreenToolbar
        eyebrow="Infrastructure"
        title="Systems"
        description="Managed AI, blockchain, market-data, database and gateway dependencies."
        badge={status ? { label: status.overall, tone: status.overall === "operational" ? "success" : status.overall === "degraded" ? "warning" : "danger" } : undefined}
        actions={[
          { label:"Service health", icon:"heart-pulse", onPress:()=>router.push(APP_ROUTES.serviceHealth as never), variant:"primary" },
          { label:"Diagnostics", icon:"stethoscope", onPress:()=>router.push(APP_ROUTES.diagnostics as never) },
          { label:"Settings", icon:"cog-outline", onPress:()=>router.push(APP_ROUTES.settings as never), variant:"ghost" },
        ]}
      />
      <Section title="Connected services" description="Provider configuration is sanitized; secret keys and private RPC URLs are never shown here.">
        {status?.items.length ? (
          <ResponsiveGrid minItemWidth={300}>{status.items.map((item)=><IntegrationStatusCard key={item.id} integration={item} />)}</ResponsiveGrid>
        ) : null}
        {!status && !error ? <Text>Loading systems…</Text> : null}
        {error ? <EmptyState title="Integration status unavailable" description={error} actionLabel="Retry" onAction={refresh} /> : null}
      </Section>
    </Screen>
  );
}
