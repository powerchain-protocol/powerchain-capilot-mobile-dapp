import { useState } from "react";
import {
  ScrollView,
  View,
} from "react-native";
import {
  ChatMessage,
  ConversationHeader,
  ConversationRail,
  MessageComposer,
  QuickPrompts,
  TypingIndicator,
  type ChatMessageModel,
} from "../../../src/components/chat";
import {
  AdaptiveSplitPane,
} from "../../../src/components/layout";
import { quickPrompts } from "../../../src/data/quick-prompts";
import {
  getConversation,
  sendCopilotMessage,
} from "../../../src/integrations/ai";
import { usePowerChainTheme } from "../../../src/theme";
import { useResponsiveLayout } from "../../../src/hooks/useResponsiveLayout";
import { LAYOUT } from "../../../src/constants/layout";

export default function CopilotScreen() {
  const { theme } = usePowerChainTheme();
  const {
    isMobile,
    horizontalPadding,
    contentMaxWidth,
  } = useResponsiveLayout();

  const [value, setValue] = useState("");
  const [conversationId, setConversationId] =
    useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [messages, setMessages] =
    useState<ChatMessageModel[]>([]);

  async function openConversation(id: string) {
    try {
      const thread = await getConversation(id);

      setConversationId(thread.id);
      setMessages(
        thread.messages
          .filter(
            (message) =>
              message.role === "assistant" ||
              message.role === "user",
          )
          .map((message) => ({
            id: message.id,
            role: message.role as "assistant" | "user",
            content: message.content,
            createdAt: new Date(
              message.createdAt,
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status:
              message.status === "failed"
                ? "failed"
                : "sent",
          })),
      );
    } catch {
      // Keep the current thread visible if loading another thread fails.
    }
  }

  function newConversation() {
    setConversationId(undefined);
    setMessages([]);
    setValue("");
  }

  async function send(message: string) {
    const user: ChatMessageModel = {
      id: `local-${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sent",
    };

    setMessages((current) => [...current, user]);
    setValue("");
    setSending(true);

    try {
      const result = await sendCopilotMessage({
        conversationId,
        message,
        context: {
          screen: "copilot",
        },
      });

      setConversationId(result.conversationId);

      setMessages((current) => [
        ...current,
        {
          id: result.messageId,
          role: "assistant",
          content: result.content,
          createdAt: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "sent",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "• Request unavailable\nPowerChain Copilot could not complete the request. Check the integration status and try again.",
          createdAt: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "failed",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const bottomReserve = isMobile
    ? LAYOUT.floatingNavHeight + 26
    : 12;

  const conversation = (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: theme.colors.background,
      }}
    >
      {isMobile ? (
        <View style={{ paddingHorizontal: horizontalPadding }}>
          <ConversationHeader />
        </View>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          width: "100%",
          maxWidth: isMobile ? contentMaxWidth : 880,
          alignSelf: "center",
          paddingHorizontal: isMobile
            ? horizontalPadding
            : 20,
          paddingTop: isMobile ? 0 : 12,
          paddingBottom: 12,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <QuickPrompts
            prompts={quickPrompts}
            onSelect={(item) => setValue(item.prompt)}
          />
        ) : null}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
          />
        ))}

        {sending ? <TypingIndicator /> : null}
      </ScrollView>

      <View
        style={{
          width: "100%",
          maxWidth: isMobile ? contentMaxWidth : 880,
          alignSelf: "center",
          paddingHorizontal: isMobile
            ? horizontalPadding
            : 20,
          paddingBottom: bottomReserve,
        }}
      >
        <MessageComposer
          value={value}
          onChangeText={setValue}
          sending={sending}
          onSend={send}
        />
      </View>
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: theme.colors.background,
        paddingHorizontal: isMobile ? 0 : horizontalPadding,
        paddingVertical: isMobile ? 0 : 16,
      }}
    >
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: contentMaxWidth,
          alignSelf: "center",
        }}
      >
        <AdaptiveSplitPane
          rail={
            <ConversationRail
              selectedId={conversationId}
              onSelect={openConversation}
              onNew={newConversation}
            />
          }
        >
          {conversation}
        </AdaptiveSplitPane>
      </View>
    </View>
  );
}
