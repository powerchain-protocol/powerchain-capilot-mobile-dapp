import type { PropsWithChildren, ReactNode } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

export function AdaptiveSplitPane({
  rail,
  children,
  railWidth = 286,
  gap = 16,
  style,
}: PropsWithChildren<{
  rail?: ReactNode;
  railWidth?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}>) {
  const { isMobile } = useResponsiveLayout();

  if (isMobile || !rail) {
    return <View style={[styles.single, style]}>{children}</View>;
  }

  return (
    <View style={[styles.split, { gap }, style]}>
      <View style={[styles.rail, { width: railWidth }]}>
        {rail}
      </View>
      <View style={styles.detail}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  single: {
    flex: 1,
    minWidth: 0,
    width: "100%",
  },
  split: {
    flex: 1,
    minWidth: 0,
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
  },
  rail: {
    minWidth: 240,
    maxWidth: 320,
    flexShrink: 0,
  },
  detail: {
    flex: 1,
    minWidth: 0,
  },
});
