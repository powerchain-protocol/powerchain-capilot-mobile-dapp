import { StyleSheet, Text, View } from "react-native";
import type { PwrcMessageReceipt } from "../../features/credits";
import { shortHash } from "../../features/credits";
import { usePowerChainTheme } from "../../theme";

export function MessageCreditReceipt({
  receipt,
}: {
  receipt: PwrcMessageReceipt;
}) {
  const { theme } = usePowerChainTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>1 MSG UNIT</Text>
      <Text style={[styles.meta, { color: theme.colors.textMuted }]}>10,000 PWRC · ≈ $0.02 ref</Text>
      <Text style={[styles.id, { color: theme.colors.textMuted }]}>
        {receipt.id} · quote {shortHash(receipt.quoteHash)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  title: { fontSize: 11, lineHeight: 15, fontWeight: "700" },
  meta: { marginTop: 1, fontSize: 10, lineHeight: 14, fontWeight: "600" },
  id: { marginTop: 3, fontSize: 9, lineHeight: 13 },
});
