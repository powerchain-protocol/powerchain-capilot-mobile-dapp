import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ChatMessage } from '@/types/copilot';

type MessageBubbleProps = {
  message: ChatMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const theme = useAppTheme();
  const isUser = message.role === 'user';
  const mcp = message.provenance?.mcp ?? [];

  return (
    <View style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
      <View
        accessible
        accessibilityLabel={`${isUser ? 'You' : 'Copilot'}: ${message.text}`}
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? theme.bubbleUser : theme.bubbleAssistant,
            borderColor: isUser ? theme.bubbleUser : theme.border,
          },
        ]}
      >
        <Text style={[styles.text, { color: isUser ? '#FFFFFF' : theme.text }]}>{message.text}</Text>
        {!isUser && message.messageUnit ? (
          <View style={[styles.receipt, { borderTopColor: theme.border }]}>
            <Text style={[styles.receiptTitle, { color: theme.textMuted }]}>
              {message.messageUnit.unit} · {message.messageUnit.id} · {Number(message.messageUnit.pwrcDebit).toLocaleString()} PWRC · ≈ ${message.messageUnit.referenceValueUsd} ref
            </Text>
            <Text style={[styles.receiptMeta, { color: theme.textMuted }]}>Signed receipt · {message.messageUnit.receiptHash.slice(0, 12)}… · reference value, not live market price</Text>
          </View>
        ) : null}
        {!isUser && (message.provenance?.provider || mcp.length > 0) ? (
          <View style={[styles.provenance, { borderTopColor: theme.border }]}>
            {message.provenance?.provider ? (
              <Text style={[styles.provenanceLabel, { color: theme.textMuted }]}>AI · {message.provenance.provider}{message.provenance.model ? ` / ${message.provenance.model}` : ''}</Text>
            ) : null}
            {mcp.length > 0 ? (
              <Text style={[styles.provenanceLabel, { color: theme.textMuted }]}>MCP · {mcp.length} external tool{mcp.length === 1 ? '' : 's'}</Text>
            ) : null}
            {mcp.slice(0, 3).map((item) => (
              <Text key={`${item.tool}-${item.status}`} style={[styles.provenanceItem, { color: theme.textMuted }]}>• {item.tool} · {item.status}</Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    marginBottom: spacing.md,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  assistantRow: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: {
    fontSize: typography.body,
    lineHeight: 23,
  },
  receipt: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.md, paddingTop: spacing.sm, gap: 3 },
  receiptTitle: { fontSize: 12, fontWeight: '700' },
  receiptMeta: { fontSize: 11, lineHeight: 16 },
  provenance: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    gap: 3,
  },
  provenanceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  provenanceItem: {
    fontSize: 11,
    lineHeight: 16,
  },
});
