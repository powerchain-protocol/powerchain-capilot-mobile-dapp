import { StyleSheet, Text, View } from "react-native";
import { usePowerChainTheme } from "../../theme";
import { radius, spacing, typography } from "../../theme/tokens";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: Tone;
}) {
  const { theme } = usePowerChainTheme();

  const dot =
    tone === "success"
      ? theme.colors.success
      : tone === "warning"
        ? theme.colors.warning
        : tone === "danger"
          ? theme.colors.danger
          : tone === "info"
            ? theme.colors.info
            : theme.colors.textMuted;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text numberOfLines={1} style={[styles.label, { color: theme.colors.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    ...typography.caption,
    fontWeight: "600",
  },
});
