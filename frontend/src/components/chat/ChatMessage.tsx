import { StyleSheet, Text, View } from "react-native";
import { radius, spacing, typography } from "../../theme/tokens";
import { usePowerChainTheme } from "../../theme";
import { ChatAvatar, type ChatRole } from "./ChatAvatar";
import { MessageContent } from "./MessageContent";
import type { McpInvocationSummary, PwrcMessageReceipt } from "../../features/credits";
import { MessageCreditReceipt } from "../credits";
import { McpProvenance } from "./McpProvenance";

export type ChatMessageModel = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
  status?: "sending" | "sent" | "failed";
  creditReceipt?: PwrcMessageReceipt;
  mcpInvocations?: McpInvocationSummary[];
};

export function ChatMessage({
  message,
}: {
  message: ChatMessageModel;
}) {
  const assistant = message.role === "assistant";
  const { theme } = usePowerChainTheme();

  return (
    <View
      style={[
        styles.row,
        assistant ? styles.assistantRow : styles.userRow,
      ]}
    >
      {assistant ? <ChatAvatar role="assistant" /> : null}

      <View
        style={[
          styles.column,
          !assistant && styles.userColumn,
        ]}
      >
        <View
          style={[
            styles.bubble,
            assistant
              ? {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderTopLeftRadius: radius.sm,
                }
              : {
                  backgroundColor: theme.colors.primary,
                  borderTopRightRadius: radius.sm,
                },
          ]}
        >
          <MessageContent
            content={message.content}
            inverse={!assistant}
          />
        </View>

        {assistant && message.creditReceipt ? (
          <MessageCreditReceipt receipt={message.creditReceipt} />
        ) : null}

        {assistant && message.mcpInvocations?.length ? (
          <McpProvenance invocations={message.mcpInvocations} />
        ) : null}

        {(message.createdAt || message.status === "failed") && (
          <Text
            style={[
              styles.meta,
              { color: theme.colors.textMuted },
              !assistant && styles.userMeta,
              message.status === "failed" && {
                color: theme.colors.danger,
              },
            ]}
          >
            {message.status === "failed"
              ? "Message not sent"
              : message.createdAt}
          </Text>
        )}
      </View>

      {!assistant ? <ChatAvatar role="user" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  column: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: "84%",
    alignItems: "flex-start",
  },
  userColumn: {
    alignItems: "flex-end",
  },
  bubble: {
    minWidth: 0,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  meta: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  userMeta: {
    textAlign: "right",
  },
});
