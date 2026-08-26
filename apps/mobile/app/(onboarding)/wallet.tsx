import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, Card, Screen } from "../../src/components/ui";
import {
  useSolanaWallet,
  verifyConnectedWallet,
} from "../../src/integrations/solana";

export default function WalletOnboardingScreen() {
  const wallet = useSolanaWallet();

  async function connectAndVerify() {
    await wallet.connect();

    // account updates after wallet provider state refresh;
    // user can then tap Verify.
  }

  async function verify() {
    if (!wallet.account) return;

    await verifyConnectedWallet({
      address: wallet.account.address,
      signMessage: wallet.signMessage,
    });

    router.push("/(onboarding)/integrations");
  }

  return (
    <Screen>
      <View style={{ paddingTop: 24, gap: 14 }}>
        <Text style={{ fontSize: 22, lineHeight: 28, fontWeight: "700" }}>
          Solana wallet
        </Text>

        <Card>
          <Text style={{ fontSize: 14, lineHeight: 20 }}>
            Wallet connection is optional during onboarding. PowerChain never receives your private keys.
          </Text>
        </Card>

        {!wallet.supported ? (
          <>
            <Text style={{ fontSize: 14, lineHeight: 20 }}>
              Mobile Wallet Adapter is not available on this platform. You can continue and link a compatible wallet later.
            </Text>
            <Button
              label="Continue without wallet"
              variant="secondary"
              fullWidth
              onPress={() => router.push("/(onboarding)/integrations")}
            />
          </>
        ) : wallet.account ? (
          <>
            <Text numberOfLines={1}>
              Connected: {wallet.account.address}
            </Text>
            <Button
              label="Verify wallet"
              fullWidth
              onPress={verify}
            />
          </>
        ) : (
          <Button
            label="Connect wallet"
            fullWidth
            onPress={connectAndVerify}
          />
        )}
      </View>
    </Screen>
  );
}
