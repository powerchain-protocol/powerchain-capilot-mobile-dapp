import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import type { QuickPrompt } from "../../data/quick-prompts";
import { usePowerChainTheme } from "../../theme";

export function QuickPrompts({
  prompts,
  onSelect,
}: {
  prompts: QuickPrompt[];
  onSelect: (prompt: QuickPrompt) => void;
}) {
  const { theme } = usePowerChainTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {prompts.map((prompt) => (
        <Pressable
          key={prompt.id}
          accessibilityRole="button"
          onPress={() => onSelect(prompt)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[styles.label, { color: theme.colors.text }]}
          >
            {prompt.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
});
