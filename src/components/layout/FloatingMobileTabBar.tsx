import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePowerChainTheme } from "../../theme";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { LAYOUT } from "../../constants/layout";

const iconByRoute: Record<
  string,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  index: "view-dashboard-outline",
  copilot: "robot-outline",
  assets: "wallet-outline",
  integrations: "connection",
  settings: "cog-outline",
};

export function FloatingMobileTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = usePowerChainTheme();
  const { isMobile, compactHeight } = useResponsiveLayout();

  if (!isMobile) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          paddingBottom: Math.max(
            compactHeight ? 6 : LAYOUT.floatingNavBottomGap,
            insets.bottom + 4,
          ),
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          {
            minHeight: compactHeight
              ? 58
              : LAYOUT.floatingNavHeight,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key].options;
          const isCopilot = route.name === "copilot";

          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
                ? options.title
                : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={({ pressed }) => [
                styles.item,
                isCopilot && styles.copilotItem,
                {
                  backgroundColor:
                    isCopilot && focused
                      ? theme.colors.primary
                      : focused
                        ? theme.colors.surfaceSubtle
                        : "transparent",
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  iconByRoute[route.name] ??
                  "circle-outline"
                }
                size={isCopilot ? 22 : 20}
                color={
                  isCopilot && focused
                    ? theme.colors.primaryForeground
                    : focused
                      ? theme.colors.primary
                      : theme.colors.textMuted
                }
              />

              {!compactHeight ? (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    {
                      color:
                        isCopilot && focused
                          ? theme.colors.primaryForeground
                          : focused
                            ? theme.colors.text
                            : theme.colors.textMuted,
                    },
                  ]}
                >
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 0,
    alignItems: "center",
  },
  bar: {
    width: "100%",
    maxWidth: 430,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 14,
  },
  copilotItem: {
    minHeight: 50,
  },
  label: {
    maxWidth: "100%",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
  },
});
