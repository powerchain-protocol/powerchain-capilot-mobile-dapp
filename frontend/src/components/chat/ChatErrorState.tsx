import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePowerChainTheme } from "../../theme";

export function ChatErrorState({
  title = "Something went wrong",
  description = "The conversation could not be loaded.",
  retryLabel = "Retry",
  onRetry,
}: {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  const { theme } = usePowerChainTheme();

  return (
    <View
      style={[
        styles.base,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={22}
        color={theme.colors.danger}
      />

      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {description}
        </Text>
      </View>

      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={[
            styles.retry,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceSubtle,
            },
          ]}
        >
          <Text style={[styles.retryLabel, { color: theme.colors.text }]}>
            {retryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  description: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
  },
  retry: {
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  retryLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
});
