import { Text, View } from "react-native";
import { Card } from "../ui";
import { usePowerChainTheme } from "../../theme";

export function OperationalMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  const { theme } = usePowerChainTheme();
  return (
    <Card padding="compact">
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>{label}</Text>
        <Text style={{ fontSize: 24, lineHeight: 30, fontWeight: "700", color: theme.colors.text }}>{value}</Text>
        {detail ? <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>{detail}</Text> : null}
      </View>
    </Card>
  );
}
