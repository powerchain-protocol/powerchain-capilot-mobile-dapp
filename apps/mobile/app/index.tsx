import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAccount } from "../src/features/account";
import { resolveOnboardingRoute } from "../src/features/onboarding";

export default function IndexRoute() {
  const { account, loading, authenticated } = useAccount();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!authenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={resolveOnboardingRoute(account)} />;
}
