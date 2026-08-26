import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthSessionProvider } from '@/context/AuthSessionContext';
import { OperationalSiteProvider } from '@/context/OperationalSiteContext';
import { RoleProvider } from '@/context/RoleContext';
import { ThemePreferenceProvider, useThemePreference } from '@/context/ThemeContext';

function RootNavigation() {
  const { resolved } = useThemePreference();
  return (
    <>
      <StatusBar style={resolved === 'carbon-dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="prompts" />
        <Stack.Screen name="copilot-credits" />
        <Stack.Screen name="diagnostics" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <AuthSessionProvider>
          <RoleProvider>
            <OperationalSiteProvider>
              <RootNavigation />
            </OperationalSiteProvider>
          </RoleProvider>
        </AuthSessionProvider>
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}
