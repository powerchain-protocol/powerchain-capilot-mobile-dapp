import { Stack } from "expo-router";
import { AppErrorBoundary } from "../src/components/feedback";
import { OfflineBanner } from "../src/features/network";
import { AppProviders } from "../src/providers";

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <OfflineBanner />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AppProviders>
    </AppErrorBoundary>
  );
}
