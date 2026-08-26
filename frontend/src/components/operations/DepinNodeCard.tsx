import { Text, View } from "react-native";
import type { DepinNode } from "@powerchain/energy-contracts";
import { Card } from "../ui";
import { usePowerChainTheme } from "../../theme";

export function DepinNodeCard({ node }: { node: DepinNode }) {
  const { theme } = usePowerChainTheme();
  const tone =
    node.status === "active"
      ? theme.colors.success
      : node.status === "degraded"
        ? theme.colors.warning
        : theme.colors.textMuted;

  return (
    <Card padding="compact">
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <Text style={{ flex: 1, fontSize: 15, fontWeight: "700", color: theme.colors.text }}>
            {node.network}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "700", color: tone }}>
            {node.status}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
          {node.nodeType} · {node.region ?? "region unavailable"}
        </Text>
        {node.rewards ? (
          <Text style={{ fontSize: 12, color: theme.colors.text }}>
            Rewards {node.rewards.amountBaseUnits} base units · {node.rewards.asset}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
