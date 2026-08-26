import { Text, View } from "react-native";
import type { EnergyFlowSnapshot } from "@powerchain/energy-contracts";
import { Card } from "../ui";
import { usePowerChainTheme } from "../../theme";
import { TelemetryFreshness } from "./TelemetryFreshness";

export function EnergyFlowCard({ flow }: { flow: EnergyFlowSnapshot }) {
  const { theme } = usePowerChainTheme();
  return (
    <Card>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: theme.colors.text }}>
            Live energy flow
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.success }}>
            {flow.mode.toUpperCase()}
          </Text>
        </View>

        {flow.nodes.map((node) => (
          <View
            key={node.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text }}>
                {node.label}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
                {node.kind} · {node.status}
              </Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text }}>
              {node.power.value} {node.power.unit}
            </Text>
          </View>
        ))}

        <TelemetryFreshness source={flow.source} />
      </View>
    </Card>
  );
}
