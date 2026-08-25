import type { PropsWithChildren } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePowerChainTheme } from "../../theme";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { LAYOUT } from "../../constants/layout";

export function Screen({
  children,
  scroll = true,
  maxWidth,
  contentContainerStyle,
  reserveFloatingNav = true,
  ...props
}: PropsWithChildren<
  ScrollViewProps & {
    scroll?: boolean;
    maxWidth?: number;
    reserveFloatingNav?: boolean;
  }
>) {
  const { theme } = usePowerChainTheme();
  const {
    isMobile,
    horizontalPadding,
    contentMaxWidth,
  } = useResponsiveLayout();

  const resolvedMaxWidth = maxWidth ?? contentMaxWidth;
  const bottomSpace =
    isMobile && reserveFloatingNav
      ? LAYOUT.floatingNavHeight + 38
      : 28;

  const body = (
    <View
      style={[
        styles.content,
        {
          maxWidth: resolvedMaxWidth,
          paddingHorizontal: horizontalPadding,
        },
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
      edges={isMobile ? ["top", "left", "right"] : ["left", "right"]}
    >
      {scroll ? (
        <ScrollView
          {...props}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomSpace },
            contentContainerStyle,
          ]}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.nonScroll, { paddingBottom: bottomSpace }]}>
          {body}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  nonScroll: {
    flex: 1,
  },
  content: {
    width: "100%",
    minWidth: 0,
    alignSelf: "center",
  },
});
