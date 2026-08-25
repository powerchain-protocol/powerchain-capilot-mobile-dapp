import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePowerChainTheme } from "../../theme";

type Action = {
  id: string;
  label: string;
  icon:
    | "content-copy"
    | "refresh"
    | "open-in-new"
    | "check-circle-outline"
    | "alert-circle-outline";
  onPress: () => void;
  disabled?: boolean;
};

export function MessageActions({ actions }: { actions: Action[] }) {
  const { theme } = usePowerChainTheme();

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          disabled={action.disabled}
          hitSlop={5}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.action,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              opacity: action.disabled ? 0.45 : pressed ? 0.72 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={action.icon}
            size={15}
            color={theme.colors.textMuted}
          />
          <Text
            numberOfLines={1}
            style={[styles.label, { color: theme.colors.textMuted }]}
          >
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  action: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  label: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },
});
