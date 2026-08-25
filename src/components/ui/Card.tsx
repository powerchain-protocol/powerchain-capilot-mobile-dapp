import type { PropsWithChildren } from "react";
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  View,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { usePowerChainTheme } from "../../theme";
import { radius, spacing } from "../../theme/tokens";

type Padding = "none" | "compact" | "default";

const paddingMap: Record<Padding, number> = {
  none: 0,
  compact: spacing.md,
  default: spacing.lg,
};

export function Card({
  children,
  padding = "default",
  style,
  ...props
}: PropsWithChildren<
  ViewProps & {
    padding?: Padding;
    style?: StyleProp<ViewStyle>;
  }
>) {
  const { theme } = usePowerChainTheme();

  return (
    <View
      {...props}
      style={[
        styles.base,
        {
          padding: paddingMap[padding],
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PressableCard({
  children,
  padding = "default",
  style,
  ...props
}: PropsWithChildren<
  Omit<PressableProps, "style"> & {
    padding?: Padding;
    style?: StyleProp<ViewStyle>;
  }
>) {
  const { theme } = usePowerChainTheme();

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.base,
        {
          padding: paddingMap[padding],
          backgroundColor: pressed
            ? theme.colors.surfaceSubtle
            : theme.colors.surface,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    minWidth: 0,
    alignSelf: "stretch",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.card,
  },
});
