import { useState } from "react";
import { router } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { Button, Screen } from "../../src/components/ui";
import { saveOnboardingProgress } from "../../src/features/onboarding";

export default function ProfileOnboardingScreen() {
  const [organization, setOrganization] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await saveOnboardingProgress({
        step: 3,
        profile: {
          organization: organization || null,
          jobTitle: jobTitle || null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          interests: ["renewables", "rwa", "ai"],
        },
      });
      router.push("/(onboarding)/wallet");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ paddingTop: 24, gap: 12 }}>
        <Text style={{ fontSize: 22, lineHeight: 28, fontWeight: "700" }}>
          Your workspace
        </Text>

        <TextInput
          value={organization}
          onChangeText={setOrganization}
          placeholder="Organization"
          style={{ minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 }}
        />

        <TextInput
          value={jobTitle}
          onChangeText={setJobTitle}
          placeholder="Role or job title"
          style={{ minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 }}
        />

        <Button
          label="Continue"
          loading={busy}
          fullWidth
          onPress={submit}
        />
      </View>
    </Screen>
  );
}
