import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePowerChainTheme } from "./ThemeProvider";
import type { ThemeName } from "./themes";

const options: Array<{ value: ThemeName; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "darkGreen", label: "Carbon Dark" },
];

export function ThemeSelector() {
  const { theme, themeName, setThemeName } = usePowerChainTheme();

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === themeName;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setThemeName(option.value)}
            style={[
              styles.item,
              {
                backgroundColor: selected
                  ? theme.colors.primary
                  : theme.colors.surface,
                borderColor: selected
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: selected
                    ? theme.colors.primaryForeground
                    : theme.colors.text,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  item: {
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
