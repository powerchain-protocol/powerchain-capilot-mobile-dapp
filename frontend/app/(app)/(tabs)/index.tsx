import { Text, View } from "react-native";
import { router } from "expo-router";
import { PowerChainLogo } from "../../../src/components/brand";
import {
  ResponsiveGrid,
} from "../../../src/components/layout";
import {
  Card,
  Screen,
  Section,
  StatusBadge,
  Button,
} from "../../../src/components/ui";
import { useAccount } from "../../../src/features/account";
import { useResponsiveLayout } from "../../../src/hooks/useResponsiveLayout";
import { usePowerChainTheme } from "../../../src/theme";

export default function HomeScreen() {
  const { account } = useAccount();
  const { theme } = usePowerChainTheme();
  const { isMobile } = useResponsiveLayout();

  return (
    <Screen>
      <View style={{ paddingTop: isMobile ? 12 : 24, gap: 8 }}>
        {isMobile ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <PowerChainLogo size={38} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 18,
                  lineHeight: 24,
                  fontWeight: "600",
                  color: theme.colors.text,
                }}
              >
                PowerChain Copilot
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 12,
                  lineHeight: 17,
                  color: theme.colors.textMuted,
                }}
              >
                {account?.displayName ?? "Operator"}
              </Text>
            </View>
            <StatusBadge label="1.0.0" tone="info" />
          </View>
        ) : null}

        <Section title="Operational overview">
          <Card>
            <StatusBadge label="Copilot ready" tone="success" />
            <Text
              style={{
                marginTop: 12,
                fontSize: isMobile ? 21 : 24,
                lineHeight: isMobile ? 27 : 30,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              Review what needs attention
            </Text>
            <Text
              style={{
                marginTop: 6,
                maxWidth: 680,
                fontSize: 14,
                lineHeight: 20,
                color: theme.colors.textMuted,
              }}
            >
              AI prepares decisions. Humans approve. Wallets authorize. PowerChain records provenance.
            </Text>
          </Card>
        </Section>

        <Section title="Command center">
          <ResponsiveGrid minItemWidth={260}>
            <Card padding="compact">
              <StatusBadge label="Operational" tone="success" />
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 15,
                  lineHeight: 21,
                  fontWeight: "600",
                  color: theme.colors.text,
                }}
              >
                • Copilot
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  lineHeight: 17,
                  color: theme.colors.textMuted,
                }}
              >
                Analysis, evidence, recommendations and prepared actions.
              </Text>
            </Card>

            <Card padding="compact">
              <StatusBadge label="Connected" tone="info" />
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 15,
                  lineHeight: 21,
                  fontWeight: "600",
                  color: theme.colors.text,
                }}
              >
                • Energy & RWA
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  lineHeight: 17,
                  color: theme.colors.textMuted,
                }}
              >
                Renewable assets, backing, evidence and positions.
              </Text>
            </Card>

            <Card padding="compact">
              <StatusBadge label="Review first" tone="warning" />
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 15,
                  lineHeight: 21,
                  fontWeight: "600",
                  color: theme.colors.text,
                }}
              >
                • Settlement
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  lineHeight: 17,
                  color: theme.colors.textMuted,
                }}
              >
                Wallet authorization remains separate from AI recommendations.
              </Text>
            </Card>
          </ResponsiveGrid>
        </Section>

        <Section title="Copilot credits">
          <Card padding="compact">
            <Text
              style={{
                fontSize: 15,
                lineHeight: 21,
                fontWeight: "600",
                color: theme.colors.text,
              }}
            >
              • PWRC message credits
            </Text>
            <Text
              style={{
                marginTop: 4,
                marginBottom: 10,
                fontSize: 12,
                lineHeight: 17,
                color: theme.colors.textMuted,
              }}
            >
              Pricing, balance, runway, funding and receipts without consuming a Copilot response.
            </Text>
            <View style={{ maxWidth: 240 }}>
              <Button
                label="Open PWRC credit center"
                variant="secondary"
                fullWidth
                onPress={() => router.push("/(app)/copilot-credits")}
              />
            </View>
          </Card>
        </Section>

        <Section title="Control principle">
          <Card padding="compact">
            <ResponsiveGrid minItemWidth={220} gap={8}>
              <Text style={{ fontSize: 14, lineHeight: 20, color: theme.colors.text }}>
                • Physical systems provide truth.
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: theme.colors.text }}>
                • AI prepares decisions.
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: theme.colors.text }}>
                • Humans approve.
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: theme.colors.text }}>
                • Wallets authorize.
              </Text>
            </ResponsiveGrid>
          </Card>
        </Section>
      </View>
    </Screen>
  );
}
