import { StyleSheet, Text, View } from "react-native";
import { usePowerChainTheme } from "../../theme";
import { spacing, typography } from "../../theme/tokens";
import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { theme } = usePowerChainTheme();

  return (
    <View style={styles.base}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    minWidth: 0,
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  title: {
    ...typography.h3,
  },
  description: {
    ...typography.body,
    maxWidth: 520,
  },
});
