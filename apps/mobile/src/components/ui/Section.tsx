import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { usePowerChainTheme } from "../../theme";
import { spacing, typography } from "../../theme/tokens";

export function Section({
  title,
  description,
  action,
  children,
}: PropsWithChildren<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
}>) {
  const { theme } = usePowerChainTheme();

  return (
    <View style={styles.section}>
      {(title || description || action) && (
        <View style={styles.header}>
          <View style={styles.copy}>
            {title ? (
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {title}
              </Text>
            ) : null}
            {description ? (
              <Text style={[styles.description, { color: theme.colors.textMuted }]}>
                {description}
              </Text>
            ) : null}
          </View>
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    minWidth: 0,
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  header: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.h3,
  },
  description: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
