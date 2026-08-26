import { Text, View } from "react-native";
import type { SafeActionPreview, SafeActionReceipt } from "@powerchain/energy-contracts";
import { Button, Card } from "../ui";
import { usePowerChainTheme } from "../../theme";

export function SafeActionReview({
  preview,
  receipt,
  loading,
  onConfirm,
  onCancel,
}: {
  preview: SafeActionPreview;
  receipt?: SafeActionReceipt | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  const { theme } = usePowerChainTheme();
  return (
    <Card>
      <View style={{ gap: 14 }}>
        <View>
          <Text style={{ fontSize: 17, fontWeight: "700", color: theme.colors.text }}>
            Review action
          </Text>
          <Text style={{ marginTop: 4, fontSize: 12, lineHeight: 17, color: theme.colors.textMuted }}>
            Preview does not execute. Confirmation is single-use and expires at {new Date(preview.expiresAt).toLocaleTimeString()}.
          </Text>
        </View>

        {preview.policyReasons.map((reason) => (
          <Text key={reason} style={{ fontSize: 13, color: theme.colors.text }}>
            • {reason}
          </Text>
        ))}

        {receipt ? (
          <Text style={{ fontSize: 13, fontWeight: "700", color: receipt.state === "completed" ? theme.colors.success : theme.colors.warning }}>
            {receipt.state.toUpperCase()}
          </Text>
        ) : (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              label="Confirm"
              onPress={onConfirm}
              loading={loading}
              disabled={!preview.confirmationToken}
              style={{ flex: 1 }}
            />
            {onCancel ? (
              <Button label="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            ) : null}
          </View>
        )}
      </View>
    </Card>
  );
}
