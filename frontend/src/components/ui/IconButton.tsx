import { Pressable, StyleSheet, type PressableProps } from "react-native";
import { usePowerChainTheme } from "../../theme";
import { radius } from "../../theme/tokens";

export function IconButton({
  label,
  children,
  bordered = true,
  disabled,
  ...props
}: PressableProps & {
  label: string;
  children: React.ReactNode;
  bordered?: boolean;
}) {
  const { theme } = usePowerChainTheme();

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderColor: bordered ? theme.colors.border : "transparent",
          borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
