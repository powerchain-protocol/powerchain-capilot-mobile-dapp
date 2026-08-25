import { Alert, Text, View } from "react-native";
import {
  ResponsiveGrid,
} from "../../../src/components/layout";
import {
  Button,
  Card,
  Screen,
  Section,
} from "../../../src/components/ui";
import { useAccount } from "../../../src/features/account";
import {
  requestNotificationPermission,
} from "../../../src/features/notifications";
import { ThemeSelector } from "../../../src/theme";
import { useResponsiveLayout } from "../../../src/hooks/useResponsiveLayout";

export default function SettingsScreen() {
  const { account, logout } = useAccount();
  const { isMobile } = useResponsiveLayout();

  async function notifications() {
    const result = await requestNotificationPermission();

    Alert.alert(
      "Notifications",
      result.granted
        ? "Notifications are enabled."
        : "Notification permission was not granted.",
    );
  }

  return (
    <Screen>
      <View style={{ paddingTop: isMobile ? 12 : 24 }}>
        <ResponsiveGrid minItemWidth={340} gap={16}>
          <Section title="Account">
            <Card>
              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 21,
                  fontWeight: "600",
                }}
              >
                {account?.displayName ?? "PowerChain account"}
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  lineHeight: 17,
                }}
              >
                {account?.email}
              </Text>
            </Card>
          </Section>

          <Section title="Appearance">
            <Card padding="compact">
              <ThemeSelector />
            </Card>
          </Section>

          <Section title="Notifications">
            <Card padding="compact">
              <Button
                label="Configure notifications"
                variant="secondary"
                fullWidth
                onPress={notifications}
              />
            </Card>
          </Section>

          <Section title="Session">
            <Card padding="compact">
              <Button
                label="Sign out"
                variant="secondary"
                fullWidth
                onPress={logout}
              />
            </Card>
          </Section>
        </ResponsiveGrid>
      </View>
    </Screen>
  );
}
