import {
  Children,
  type PropsWithChildren,
} from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

export function ResponsiveGrid({
  children,
  minItemWidth = 280,
  gap = 12,
  maxColumns = 3,
  style,
}: PropsWithChildren<{
  minItemWidth?: number;
  gap?: number;
  maxColumns?: 1 | 2 | 3 | 4;
  style?: StyleProp<ViewStyle>;
}>) {
  const {
    width,
    isMobile,
    isTablet,
    horizontalPadding,
  } = useResponsiveLayout();

  const items = Children.toArray(children);

  const available = Math.max(
    0,
    width - horizontalPadding * 2,
  );

  const deviceMax = isMobile ? 1 : isTablet ? 2 : maxColumns;

  const calculated = Math.max(
    1,
    Math.floor(
      (available + gap) /
        Math.max(1, minItemWidth + gap),
    ),
  );

  const columns = Math.min(
    deviceMax,
    maxColumns,
    calculated,
    Math.max(1, items.length),
  );

  const grow = 1;
  const basis =
    columns === 1
      ? "100%"
      : columns === 2
        ? "48%"
        : columns === 3
          ? "31%"
          : "23%";

  return (
    <View style={[styles.grid, { gap }, style]}>
      {items.map((child, index) => (
        <View
          key={index}
          style={[
            styles.item,
            {
              flexGrow: grow,
              flexBasis: basis,
            },
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
  },
  item: {
    minWidth: 0,
    flexShrink: 1,
  },
});
