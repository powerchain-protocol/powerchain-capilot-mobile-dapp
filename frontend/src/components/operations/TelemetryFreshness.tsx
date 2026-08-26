import { Text, View } from "react-native";
import type { SourceMeta } from "@powerchain/energy-contracts";
import { usePowerChainTheme } from "../../theme";

export function TelemetryFreshness({ source }: { source: SourceMeta }) {
  const { theme } = usePowerChainTheme();
  const ageSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(source.observedAt).getTime()) / 1000),
  );
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
        {source.source}
      </Text>
      <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
        {ageSeconds}s old
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color:
            source.quality === "good"
              ? theme.colors.success
              : source.quality === "stale"
                ? theme.colors.warning
                : theme.colors.textMuted,
        }}
      >
        {source.quality}
      </Text>
    </View>
  );
}
