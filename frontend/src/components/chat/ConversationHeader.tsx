import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePowerChainTheme } from "../../theme";
import { PowerChainLogo } from "../brand";

export function ConversationHeader({
  title = "PowerChain Copilot",
  subtitle = "Renewable infrastructure assistant",
  online = true,
  onMenu,
  onNewChat,
}: {
  title?: string;
  subtitle?: string;
  online?: boolean;
  onMenu?: () => void;
  onNewChat?: () => void;
}) {
  const { theme } = usePowerChainTheme();

  return (
    <View style={styles.row}>
      {onMenu ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open conversations"
          hitSlop={7}
          onPress={onMenu}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="menu" size={22} color={theme.colors.text} />
        </Pressable>
      ) : null}

      <PowerChainLogo size={34} variant="green" />

      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: online
                  ? theme.colors.success
                  : theme.colors.warning,
              },
            ]}
          />
          <Text
            numberOfLines={1}
            style={[styles.subtitle, { color: theme.colors.textMuted }]}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      {onNewChat ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New conversation"
          hitSlop={7}
          onPress={onNewChat}
          style={[styles.iconButton,{borderColor:theme.colors.border,backgroundColor:theme.colors.surface}]}
        >
          <MaterialCommunityIcons name="square-edit-outline" size={20} color={theme.colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    minWidth: 0,
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  statusRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subtitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 15,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
});
