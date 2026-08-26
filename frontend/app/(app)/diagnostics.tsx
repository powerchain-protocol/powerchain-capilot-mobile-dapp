import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { Text } from "react-native";
import { ResponsiveGrid, ScreenToolbar } from "../../src/components/layout";
import { Card, EmptyState, Screen, Section, StatusBadge } from "../../src/components/ui";
import { getDiagnosticSnapshot, type DiagnosticSnapshot } from "../../src/integrations/status";
import { APP_ROUTES } from "../../src/constants/routes";
import { usePowerChainTheme } from "../../src/theme";

function countMcp(snapshot: DiagnosticSnapshot | null) {
  return snapshot?.mcp?.servers?.reduce(
    (count, server) => count + (server.tools?.length ?? 0),
    0,
  ) ?? 0;
}

export default function DiagnosticsScreen() {
  const { theme } = usePowerChainTheme();
  const [data, setData] = useState<DiagnosticSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setData(await getDiagnosticSnapshot());
    } catch (value) {
      setError(value instanceof Error ? value.message : "Diagnostics unavailable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const mcpTools = useMemo(() => countMcp(data), [data]);
  const badge = data
    ? {
        label: data.failures.length
          ? `${data.failures.length} unavailable`
          : "Complete",
        tone: data.failures.length ? ("warning" as const) : ("success" as const),
      }
    : undefined;

  return (
    <Screen>
      <ScreenToolbar
        eyebrow="Sanitized runtime"
        title="Diagnostics"
        description="Safe operational diagnostics. Secrets, private RPC URLs, credentials and raw MCP results are never rendered."
        badge={badge}
        actions={[
          {
            label: loading ? "Refreshing…" : "Refresh",
            icon: "refresh",
            onPress: () => void refresh(),
            variant: "primary",
          },
          {
            label: "Service health",
            icon: "heart-pulse",
            onPress: () => router.push(APP_ROUTES.serviceHealth as never),
          },
        ]}
      />

      {error ? (
        <EmptyState
          title="Diagnostics unavailable"
          description={error}
          actionLabel="Retry"
          onAction={refresh}
        />
      ) : null}

      <Section title="Control surfaces">
        <ResponsiveGrid minItemWidth={250}>
          <Card padding="compact">
            <StatusBadge label="MCP" tone={data?.mcp?.enabled ? "success" : "neutral"} />
            <Text style={{ marginTop: 10, fontSize: 22, fontWeight: "700", color: theme.colors.text }}>
              {mcpTools}
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
              allowlisted read-only tools visible
            </Text>
          </Card>

          <Card padding="compact">
            <StatusBadge label="PWRC" tone={data?.credits ? "success" : "warning"} />
            <Text style={{ marginTop: 10, fontSize: 15, fontWeight: "600", color: theme.colors.text }}>
              Credit reconciliation
            </Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: theme.colors.textMuted }}>
              {data?.credits ? "Authenticated reconciliation endpoint reachable" : "Unavailable"}
            </Text>
          </Card>

          <Card padding="compact">
            <StatusBadge label="Solana" tone={data?.solana ? "success" : "warning"} />
            <Text style={{ marginTop: 10, fontSize: 15, fontWeight: "600", color: theme.colors.text }}>
              Sanitized runtime
            </Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: theme.colors.textMuted }}>
              {data?.solana ? "Cluster/provider/program metadata available" : "Unavailable"}
            </Text>
          </Card>

          <Card padding="compact">
            <StatusBadge label="CORS" tone={data?.cors ? "success" : "warning"} />
            <Text style={{ marginTop: 10, fontSize: 15, fontWeight: "600", color: theme.colors.text }}>
              Origin policy
            </Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: theme.colors.textMuted }}>
              {data?.cors ? "CORS policy diagnostics available" : "Unavailable"}
            </Text>
          </Card>
        </ResponsiveGrid>
      </Section>

      {data?.failures.length ? (
        <Section title="Unavailable checks">
          <Card padding="compact">
            <Text style={{ fontSize: 12, lineHeight: 17, color: theme.colors.textMuted }}>
              {data.failures.join(" · ")}
            </Text>
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}
