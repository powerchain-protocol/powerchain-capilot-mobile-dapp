import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { radius } from "../../theme/tokens";
import { usePowerChainTheme } from "../../theme";

export type ChatRole = "assistant" | "user";

export function ChatAvatar({
  role,
  size = 32,
}: {
  role: ChatRole;
  size?: number;
}) {
  const assistant = role === "assistant";
  const { theme } = usePowerChainTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: Math.min(radius.md, size / 2),
          backgroundColor: assistant
            ? theme.colors.primary
            : theme.colors.surfaceSubtle,
          borderColor: assistant
            ? theme.colors.primary
            : theme.colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={assistant ? "robot-outline" : "account-outline"}
        size={Math.round(size * 0.56)}
        color={
          assistant
            ? theme.colors.primaryForeground
            : theme.colors.text
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
