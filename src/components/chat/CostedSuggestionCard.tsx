import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePowerChainTheme } from "../../theme";

export function CostedSuggestionCard({
  title,
  description,
  onPress,
  costLabel = "10,000 PWRC · ≈ $0.02 ref",
}: {
  title: string;
  description: string;
  onPress: () => void;
  costLabel?: string;
}) {
  const { theme } = usePowerChainTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text numberOfLines={2} style={[styles.description, { color: theme.colors.textMuted }]}>{description}</Text>
      <View style={styles.footer}>
        <Text style={[styles.cost, { color: theme.colors.textMuted }]}>{costLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minWidth: 220, flex: 1, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12 },
  title: { fontSize: 13, lineHeight: 18, fontWeight: "700" },
  description: { marginTop: 3, fontSize: 11, lineHeight: 16 },
  footer: { marginTop: 10 },
  cost: { fontSize: 10, lineHeight: 14, fontWeight: "600" },
});
