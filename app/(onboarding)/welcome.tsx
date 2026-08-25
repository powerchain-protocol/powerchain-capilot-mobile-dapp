import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, Card, Screen } from "../../src/components/ui";
import { PowerChainLogo } from "../../src/components/brand";

export default function WelcomeScreen() {
  return (
    <Screen>
      <View style={{ paddingTop: 32, gap: 18 }}>
        <PowerChainLogo size={52} />
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 26, lineHeight: 32, fontWeight: "700" }}>
            PowerChain Copilot
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 22 }}>
            AI operations for renewable infrastructure, evidence, RWA and Solana workflows.
          </Text>
        </View>

        <Card>
          <Text style={{ fontSize: 15, lineHeight: 21, fontWeight: "600" }}>
            • Review before execution
          </Text>
          <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 20 }}>
            Copilot can analyze and prepare actions. You remain in control of approvals and wallet authorization.
          </Text>
        </Card>

        <Button
          label="Get started"
          fullWidth
          onPress={() => router.push("/(onboarding)/account")}
        />
      </View>
    </Screen>
  );
}
