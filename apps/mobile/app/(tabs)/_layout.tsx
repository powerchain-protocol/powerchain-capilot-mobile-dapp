import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

export default function TabLayout() {
  const theme = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: Platform.OS === 'web' ? 64 : undefined,
          maxWidth: Platform.OS === 'web' ? 920 : undefined,
          alignSelf: Platform.OS === 'web' ? 'center' : undefined,
          width: Platform.OS === 'web' ? '100%' : undefined,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="copilot" options={{ title: 'Copilot' }} />
      <Tabs.Screen name="index" options={{ title: 'Command' }} />
      <Tabs.Screen name="assets" options={{ title: 'Assets' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="credits" options={{ href: null }} />
      <Tabs.Screen name="activity" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
