import { StyleSheet, Text, View } from "react-native";
import type { ChartCardProps } from "../../types/charts";
import { formatChartValue } from "../../utils/formats";
import { radius, spacing, typography } from "../../theme/tokens";
import { usePowerChainTheme } from "../../theme";
import { Card } from "../ui/Card";

export function ChartCard({
  chart,
  loading = false,
  error = null,
}: ChartCardProps) {
  const { theme } = usePowerChainTheme();

  if (loading) {
    return (
      <Card>
        <View
          style={[
            styles.headerSkeleton,
            { backgroundColor: theme.colors.skeleton },
          ]}
        />
        <View
          style={[
            styles.chartSkeleton,
            { backgroundColor: theme.colors.surfaceSubtle },
          ]}
        />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {chart.title}
        </Text>
        <Text style={[styles.error, { color: theme.colors.danger }]}>
          {error}
        </Text>
      </Card>
    );
  }

  const max = Math.max(
    ...chart.data.map((item) => item.value ?? 0),
    1,
  );

  return (
    <Card>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {chart.title}
      </Text>

      {chart.description ? (
        <Text
          style={[
            styles.description,
            { color: theme.colors.textMuted },
          ]}
        >
          {chart.description}
        </Text>
      ) : null}

      <View style={styles.rows}>
        {chart.data.map((item) => {
          const value = item.value ?? 0;
          const ratio = Math.max(
            0,
            Math.min(value / max, 1),
          );

          return (
            <View key={item.label} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    { color: theme.colors.text },
                  ]}
                >
                  {item.label}
                </Text>

                <Text
                  style={[
                    styles.value,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {formatChartValue(
                    value,
                    chart.valueFormat,
                    chart.currency,
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.track,
                  { backgroundColor: theme.colors.surfaceSubtle },
                ]}
              >
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(
                        3,
                        ratio * 100,
                      )}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  description: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  rows: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  row: {
    gap: spacing.sm,
  },
  rowHeader: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  label: {
    ...typography.label,
    flex: 1,
    minWidth: 0,
  },
  value: {
    ...typography.caption,
    fontWeight: "600",
  },
  track: {
    height: 7,
    borderRadius: radius.xs,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.xs,
  },
  error: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  headerSkeleton: {
    width: "42%",
    height: 14,
    borderRadius: radius.xs,
  },
  chartSkeleton: {
    width: "100%",
    height: 128,
    marginTop: spacing.lg,
    borderRadius: radius.md,
  },
});
