import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  IntegrationStatusCard,
} from "../src/components/integrations";
import { Screen } from "../src/components/ui";
import {
  getIntegrationStatus,
} from "../src/integrations/status";
import type {
  IntegrationSummary,
} from "../src/types/integrations";

export default function IntegrationsScreenExample() {
  const [status, setStatus] =
    useState<IntegrationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getIntegrationStatus()
      .then(setStatus)
      .catch((value) =>
        setError(
          value instanceof Error
            ? value.message
            : "Integration status unavailable.",
        ),
      );
  }, []);

  return (
    <Screen>
      <View style={{ paddingTop: 20, gap: 12 }}>
        <Text
          style={{
            fontSize: 20,
            lineHeight: 26,
            fontWeight: "600",
          }}
        >
          Integrations
        </Text>

        {error ? <Text>{error}</Text> : null}

        {status?.items.map((item) => (
          <IntegrationStatusCard
            key={item.id}
            integration={item}
          />
        ))}
      </View>
    </Screen>
  );
}
