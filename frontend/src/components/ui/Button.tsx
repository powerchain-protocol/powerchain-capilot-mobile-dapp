import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { usePowerChainTheme } from "../../theme";
import { radius, spacing, typography } from "../../theme/tokens";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const heights: Record<Size, number> = {
  sm: 36,
  md: 44,
  lg: 48,
};

const padding: Record<Size, number> = {
  sm: 12,
  md: 16,
  lg: 18,
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  left,
  right,
  style,
  labelStyle,
  ...props
}: Omit<PressableProps, "style"> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}) {
  const { theme } = usePowerChainTheme();
  const blocked = disabled || loading;

  const foreground =
    variant === "primary" || variant === "danger"
      ? theme.colors.primaryForeground
      : theme.colors.text;

  const background =
    variant === "primary"
      ? theme.colors.primary
      : variant === "danger"
        ? theme.colors.danger
        : variant === "ghost"
          ? "transparent"
          : theme.colors.surface;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: heights[size],
          paddingHorizontal: padding[size],
          backgroundColor: background,
          borderColor:
            variant === "secondary"
              ? theme.colors.border
              : "transparent",
          borderWidth: variant === "secondary" ? StyleSheet.hairlineWidth : 0,
          opacity: blocked ? 0.5 : pressed ? 0.86 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <>
          {left}
          <Text
            numberOfLines={1}
            style={[styles.label, { color: foreground }, labelStyle]}
          >
            {label}
          </Text>
          {right}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  fullWidth: {
    width: "100%",
  },
  label: {
    ...typography.label,
  },
});
