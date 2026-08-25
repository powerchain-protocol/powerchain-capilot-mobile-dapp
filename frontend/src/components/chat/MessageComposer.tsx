import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from "react-native";
import { useMemo, useState } from "react";
import { usePowerChainTheme } from "../../theme";

export const MAX_MESSAGE_LENGTH = 2000;

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: (value: string) => void | Promise<void>;
  onStop?: () => void | Promise<void>;
  onOpenCredits?: () => void;
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
  insufficientCredits?: boolean;
  creditCostLabel?: string;
};

export function MessageComposer({
  value,
  onChangeText,
  onSend,
  onStop,
  onOpenCredits,
  placeholder = "Message PowerChain Copilot",
  disabled = false,
  sending = false,
  insufficientCredits = false,
  creditCostLabel = "10,000 PWRC / response · ≈ $0.02 ref",
}: Props) {
  const { theme } = usePowerChainTheme();
  const [inputHeight, setInputHeight] = useState(44);

  const trimmed = value.trim();
  const count = value.length;
  const remaining = MAX_MESSAGE_LENGTH - count;
  const nearLimit = remaining <= 200;
  const blocked =
    disabled || trimmed.length === 0 || count > MAX_MESSAGE_LENGTH;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          width: "100%",
          minWidth: 0,
          padding: 8,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          borderRadius: 14,
          backgroundColor: theme.colors.surface,
        },
        inputRow: {
          minWidth: 0,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
        },
        input: {
          flex: 1,
          minWidth: 0,
          minHeight: 44,
          maxHeight: 132,
          paddingHorizontal: 8,
          paddingTop: 10,
          paddingBottom: 10,
          color: theme.colors.text,
          fontSize: 15,
          lineHeight: 21,
          textAlignVertical: "top",
        },
        send: {
          width: 42,
          height: 42,
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          backgroundColor: sending
            ? theme.colors.danger
            : insufficientCredits
              ? theme.colors.surfaceSubtle
              : blocked
                ? theme.colors.surfaceSubtle
                : theme.colors.primary,
        },
        footer: {
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          paddingHorizontal: 8,
          paddingTop: 4,
          paddingBottom: 1,
        },
        cost: {
          flex: 1,
          minWidth: 0,
          fontSize: 10,
          lineHeight: 14,
          fontWeight: "600",
          color: insufficientCredits
            ? theme.colors.warning
            : theme.colors.textMuted,
        },
        counter: {
          fontSize: 11,
          lineHeight: 15,
          fontWeight: "500",
          color: nearLimit
            ? remaining < 0
              ? theme.colors.danger
              : theme.colors.warning
            : theme.colors.textMuted,
        },
      }),
    [theme, blocked, nearLimit, remaining, sending, insufficientCredits],
  );

  function handleContentSizeChange(
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) {
    setInputHeight(
      Math.max(44, Math.min(132, event.nativeEvent.contentSize.height)),
    );
  }

  async function action() {
    if (sending) {
      await onStop?.();
      return;
    }
    if (insufficientCredits) {
      onOpenCredits?.();
      return;
    }
    if (blocked) return;
    await onSend(trimmed);
  }

  return (
    <View style={styles.shell}>
      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel="Message PowerChain Copilot"
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          value={value}
          editable={!disabled && !sending}
          onChangeText={onChangeText}
          onContentSizeChange={handleContentSizeChange}
          style={[styles.input, { height: inputHeight }]}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            sending
              ? "Stop generation"
              : insufficientCredits
                ? "Open PWRC credit center"
                : "Send message"
          }
          disabled={!sending && !insufficientCredits && blocked}
          hitSlop={6}
          onPress={action}
          style={({ pressed }) => [
            styles.send,
            pressed && { opacity: 0.86 },
          ]}
        >
          <MaterialCommunityIcons
            name={
              sending
                ? "stop"
                : insufficientCredits
                  ? "wallet-outline"
                  : "arrow-up"
            }
            size={21}
            color={
              sending
                ? theme.colors.primaryForeground
                : insufficientCredits || blocked
                  ? theme.colors.textMuted
                  : theme.colors.primaryForeground
            }
          />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text numberOfLines={1} style={styles.cost}>
          {insufficientCredits
            ? "Insufficient PWRC · Open credit center"
            : creditCostLabel}
        </Text>
        <Text style={styles.counter}>{count} / {MAX_MESSAGE_LENGTH}</Text>
      </View>
    </View>
  );
}
