import { StyleSheet, Text, View } from "react-native";
import type {
  IntegrationHealth,
  IntegrationStatus,
} from "../../types/integrations";
import { Card } from "../ui/Card";
import { StatusBadge } from "../ui/StatusBadge";
import { usePowerChainTheme } from "../../theme";

function toneForStatus(
  status: IntegrationStatus,
): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "operational":
      return "success";
    case "degraded":
      return "warning";
    case "unavailable":
    case "misconfigured":
      return "danger";
    default:
      return "neutral";
  }
}

export function IntegrationStatusCard({
  integration,
}: {
  integration: IntegrationHealth;
}) {
  const { theme } = usePowerChainTheme();

  return (
    <Card padding="compact">
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text
            numberOfLines={1}
            style={[styles.title, { color: theme.colors.text }]}
          >
            {integration.name}
          </Text>

          {integration.message ? (
            <Text
              numberOfLines={2}
              style={[
                styles.description,
                { color: theme.colors.textMuted },
              ]}
            >
              {integration.message}
            </Text>
          ) : null}
        </View>

        <StatusBadge
          label={integration.status}
          tone={toneForStatus(integration.status)}
        />
      </View>

      {typeof integration.latencyMs === "number" ? (
        <Text
          style={[
            styles.meta,
            { color: theme.colors.textMuted },
          ]}
        >
          {integration.latencyMs} ms
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  description: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
  },
  meta: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 15,
  },
});
