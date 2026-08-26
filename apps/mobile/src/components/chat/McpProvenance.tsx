import { StyleSheet, Text, View } from "react-native";
import type { McpInvocationSummary } from "../../features/credits";
import { usePowerChainTheme } from "../../theme";
import { radius, spacing, typography } from "../../theme/tokens";

export function McpProvenance({ invocations }: { invocations: McpInvocationSummary[] }) {
  const { theme } = usePowerChainTheme();
  if (!invocations.length) return null;
  return (
    <View style={[styles.box, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceSubtle }]}> 
      <Text style={[styles.title, { color: theme.colors.textMuted }]}>MCP · {invocations.length} external read{invocations.length === 1 ? "" : "s"}</Text>
      {invocations.slice(0, 4).map((item) => (
        <Text key={`${item.serverId}:${item.functionName}`} style={[styles.item, { color: theme.colors.textMuted }]} numberOfLines={1}>
          • {item.serverId} / {item.toolName} · {item.status}
        </Text>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  box: { marginTop: spacing.xs, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 7, maxWidth: "100%" },
  title: { ...typography.caption, fontWeight: "600", marginBottom: 2 },
  item: { ...typography.caption },
});
