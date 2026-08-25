import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePowerChainTheme } from "../../theme";
import { formatPwrcTokens, type PwrcCreditAccount } from "../../features/credits";

export function CreditBalanceBar({
  account,
  onPress,
}: {
  account: PwrcCreditAccount | null;
  onPress: () => void;
}) {
  const { theme } = usePowerChainTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open PWRC credit center"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderColor: account?.lowCredit
            ? theme.colors.warning
            : theme.colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.icon}>
        <MaterialCommunityIcons name="wallet-outline" size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>
          {account ? `${formatPwrcTokens(account.availablePwrc)} PWRC` : "PWRC Credits"}
        </Text>
        <Text numberOfLines={1} style={[styles.meta, { color: theme.colors.textMuted }]}>
          {account ? `${account.responseRunway} completed responses remaining` : "Loading balance…"}
        </Text>
      </View>
      <Text style={[styles.cost, { color: theme.colors.textMuted }]}>10,000 / response</Text>
      <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: 0,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  icon: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 12, lineHeight: 17, fontWeight: "700" },
  meta: { fontSize: 10, lineHeight: 14 },
  cost: { fontSize: 9, lineHeight: 13, fontWeight: "600" },
});
