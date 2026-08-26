import { Text, View } from "react-native";
import type { IotDevice } from "@powerchain/energy-contracts";
import { Card } from "../ui";
import { usePowerChainTheme } from "../../theme";

export function DeviceStatusCard({ device }: { device: IotDevice }) {
  const { theme } = usePowerChainTheme();
  const tone =
    device.connectivity === "online"
      ? theme.colors.success
      : device.connectivity === "degraded"
        ? theme.colors.warning
        : theme.colors.danger;

  return (
    <Card padding="compact">
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, fontWeight: "700", color: theme.colors.text }}>
            {device.name}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "700", color: tone }}>
            {device.connectivity}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
          {device.kind.replaceAll("_", " ")}
          {device.model ? ` · ${device.model}` : ""}
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
          Last seen {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "unknown"}
        </Text>
      </View>
    </Card>
  );
}
