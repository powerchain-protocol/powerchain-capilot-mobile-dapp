import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { PowerChainLogo } from "../../src/components/brand";
import { Button, Screen } from "../../src/components/ui";
import { useAccount } from "../../src/features/account";
import { resolveOnboardingRoute } from "../../src/features/onboarding";
import { usePowerChainTheme } from "../../src/theme";

export default function LoginScreen() {
  const { login } = useAccount();
  const { theme } = usePowerChainTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const account = await login({ email, password });
      router.replace(resolveOnboardingRoute(account));
    } catch (value) {
      setError(value instanceof Error ? value.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    minHeight: 46,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: theme.colors.text,
    backgroundColor: theme.colors.input,
  } as const;

  return (
    <Screen>
      <View style={{ paddingTop: 52, gap: 16 }}>
        <PowerChainLogo size={52} />
        <View style={{ gap: 5 }}>
          <Text style={{ fontSize: 24, lineHeight: 30, fontWeight: "700", color: theme.colors.text }}>
            Welcome back
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: theme.colors.textMuted }}>
            Sign in to PowerChain Copilot.
          </Text>
        </View>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={inputStyle}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          style={inputStyle}
        />

        {error ? (
          <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>
            {error}
          </Text>
        ) : null}

        <Button label="Sign in" fullWidth loading={busy} onPress={submit} />
        <Button
          label="Create account"
          variant="secondary"
          fullWidth
          onPress={() => router.push("/(onboarding)/account")}
        />
      </View>
    </Screen>
  );
}
