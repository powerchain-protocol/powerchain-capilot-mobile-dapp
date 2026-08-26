import { Alert, Text } from "react-native";
import { router } from "expo-router";
import { ResponsiveGrid, ScreenToolbar } from "../../src/components/layout";
import { Button, Card, Screen, Section } from "../../src/components/ui";
import { useAccount } from "../../src/features/account";
import { requestNotificationPermission } from "../../src/features/notifications";
import { ThemeSelector } from "../../src/theme";
import { APP_ROUTES } from "../../src/constants/routes";

export default function SettingsScreen() {
  const { account, logout } = useAccount();
  async function notifications() {
    const result = await requestNotificationPermission();
    Alert.alert("Notifications", result.granted ? "Notifications are enabled." : "Notification permission was not granted.");
  }
  return (
    <Screen>
      <ScreenToolbar title="Settings" eyebrow="Operator configuration" description="Account, appearance, notification and session controls." actions={[{label:"Diagnostics",icon:"stethoscope",onPress:()=>router.push(APP_ROUTES.diagnostics as never)}]} />
      <ResponsiveGrid minItemWidth={340} gap={16}>
        <Section title="Account"><Card><Text style={{fontSize:15,lineHeight:21,fontWeight:"600"}}>{account?.displayName ?? "PowerChain account"}</Text><Text style={{marginTop:4,fontSize:12,lineHeight:17}}>{account?.email}</Text></Card></Section>
        <Section title="Appearance"><Card padding="compact"><ThemeSelector /></Card></Section>
        <Section title="Notifications"><Card padding="compact"><Button label="Configure notifications" variant="secondary" fullWidth onPress={notifications} /></Card></Section>
        <Section title="Session"><Card padding="compact"><Button label="Sign out" variant="secondary" fullWidth onPress={logout} /></Card></Section>
      </ResponsiveGrid>
    </Screen>
  );
}
