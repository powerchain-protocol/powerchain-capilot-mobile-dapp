import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, Card, Screen, StatusBadge } from "../../src/components/ui";
import { saveOnboardingProgress } from "../../src/features/onboarding";

export default function IntegrationsOnboardingScreen() {
  async function submit() {
    await saveOnboardingProgress({ step: 5 });
    router.push("/(onboarding)/complete");
  }

  return (
    <Screen>
      <View style={{ paddingTop: 24, gap: 12 }}>
        <Text style={{ fontSize: 22, lineHeight: 28, fontWeight: "700" }}>
          Data & AI
        </Text>

        <Card>
          <StatusBadge label="Server managed" tone="success" />
          <Text style={{ marginTop: 8, fontSize: 15, lineHeight: 21, fontWeight: "600" }}>
            • PowerChain Copilot AI
          </Text>
          <Text style={{ marginTop: 4, fontSize: 14, lineHeight: 20 }}>
            AI requests are sent through the authenticated PowerChain API. Provider keys are never embedded in the mobile bundle.
          </Text>
        </Card>

        <Card>
          <Text style={{ fontSize: 15, lineHeight: 21, fontWeight: "600" }}>
            • Pyth + Birdeye
          </Text>
          <Text style={{ marginTop: 4, fontSize: 14, lineHeight: 20 }}>
            Oracle and market data are normalized by the backend before they reach the mobile app.
          </Text>
        </Card>

        <Button label="Continue" fullWidth onPress={submit} />
      </View>
    </Screen>
  );
}
