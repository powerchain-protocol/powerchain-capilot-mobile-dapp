import { useState } from "react";
import { router } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { Button, Screen } from "../../src/components/ui";
import { useAccount } from "../../src/features/account";

export default function AccountOnboardingScreen() {
  const { register } = useAccount();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await register({ displayName, email, password });
      router.push("/(onboarding)/profile");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Account creation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ paddingTop: 24, gap: 12 }}>
        <Text style={{ fontSize: 22, lineHeight: 28, fontWeight: "700" }}>
          Create your account
        </Text>

        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Name"
          autoCapitalize="words"
          style={{ minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 }}
        />

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={{ minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 }}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={{ minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 }}
        />

        {error ? <Text style={{ color: "#C9372C" }}>{error}</Text> : null}

        <Button
          label="Continue"
          loading={busy}
          fullWidth
          onPress={submit}
        />

        <Button
          label="Already have an account"
          variant="secondary"
          fullWidth
          onPress={() => router.replace("/(auth)/login")}
        />
      </View>
    </Screen>
  );
}
