import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, Card, Screen } from "../../src/components/ui";
import { completeOnboarding } from "../../src/features/onboarding";

export default function CompleteOnboardingScreen() {
  async function finish() {
    await completeOnboarding();
    router.replace("/(app)/(tabs)");
  }

  return (
    <Screen>
      <View style={{ paddingTop: 40, gap: 16 }}>
        <Text style={{ fontSize: 26, lineHeight: 32, fontWeight: "700" }}>
          Copilot is ready
        </Text>

        <Card>
          <Text style={{ fontSize: 15, lineHeight: 21, fontWeight: "600" }}>
            • Your operating boundary
          </Text>
          <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 20 }}>
            AI analyzes and prepares. You review. Wallets authorize. PowerChain records the resulting provenance.
          </Text>
        </Card>

        <Button label="Open PowerChain" fullWidth onPress={finish} />
      </View>
    </Screen>
  );
}
