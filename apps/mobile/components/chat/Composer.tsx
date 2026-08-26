import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { COPILOT_MESSAGE_LIMIT } from '@/constants/product';
import { COPILOT_RESPONSE_COST_LABEL } from '@/constants/pwrc';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

type ComposerProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export function Composer({ value, onChangeText, onSubmit, disabled = false }: ComposerProps) {
  const theme = useAppTheme();
  const canSubmit = value.trim().length > 0 && !disabled;

  return (
    <View style={[styles.container, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
      <View style={[styles.inputShell, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TextInput
          accessibilityLabel="Message PowerChain Copilot"
          editable={!disabled}
          maxLength={COPILOT_MESSAGE_LIMIT}
          multiline
          onChangeText={onChangeText}
          placeholder="Ask about operations, assets, evidence, or risk…"
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.text }]}
          value={value}
        />
        <View style={styles.footer}>
          <View style={styles.meta}>
            <Text style={[styles.cost, { color: theme.textMuted }]}>{COPILOT_RESPONSE_COST_LABEL}</Text>
            <Text style={[styles.counter, { color: theme.textMuted }]}>{value.length}/{COPILOT_MESSAGE_LIMIT}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={onSubmit}
            style={({ pressed }) => [
              styles.send,
              { backgroundColor: pressed ? theme.primaryPressed : theme.primary },
              !canSubmit && styles.sendDisabled,
            ]}
          >
            {disabled ? (
              <ActivityIndicator color={theme.primaryText} size="small" />
            ) : (
              <Text style={[styles.sendLabel, { color: theme.primaryText }]}>Send</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  inputShell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  input: {
    minHeight: 52,
    maxHeight: 140,
    fontSize: typography.body,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  footer: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  meta: { flex: 1, gap: 2 },
  cost: { fontSize: typography.micro, fontWeight: '700' },
  counter: { fontSize: typography.micro },
  send: {
    minWidth: 72,
    minHeight: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  sendDisabled: {
    opacity: 0.45,
  },
  sendLabel: {
    fontSize: typography.small,
    fontWeight: '800',
  },
});
