import { Tabs } from "expo-router";
import { FloatingMobileTabBar, ResponsiveHeader } from "../../../src/components/layout";
import { usePowerChainTheme } from "../../../src/theme";
import { useResponsiveLayout } from "../../../src/hooks/useResponsiveLayout";

export default function TabsLayout() {
  const { theme } = usePowerChainTheme();
  const { isMobile } = useResponsiveLayout();

  return (
    <Tabs
      tabBar={(props) => <FloatingMobileTabBar {...props} />}
      screenOptions={{
        headerShown: !isMobile,
        header: () => <ResponsiveHeader />,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Overview", tabBarLabel: "Overview" }} />
      <Tabs.Screen name="action-center" options={{ title: "Action Center", tabBarLabel: "Actions" }} />
      <Tabs.Screen name="copilot" options={{ title: "Copilot", tabBarLabel: "Copilot" }} />
      <Tabs.Screen name="assets" options={{ title: "Assets", tabBarLabel: "Assets" }} />
      <Tabs.Screen name="integrations" options={{ title: "Systems", tabBarLabel: "Systems" }} />
    </Tabs>
  );
}
