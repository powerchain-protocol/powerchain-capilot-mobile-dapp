import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import {
  ChatMessage,
  ConversationHeader,
  ConversationRail,
  MessageComposer,
  QuickPrompts,
  TypingIndicator,
  CostedSuggestionCard,
  type ChatMessageModel,
} from "../../../src/components/chat";
import { AdaptiveSplitPane, ScreenToolbar } from "../../../src/components/layout";
import { quickPrompts } from "../../../src/data/quick-prompts";
import {
  cancelCopilotMessage,
  getConversation,
  sendCopilotMessage,
} from "../../../src/integrations/ai";
import { formatPwrcTokens, usePwrcCredits } from "../../../src/features/credits";
import { CreditBalanceBar } from "../../../src/components/credits";
import { usePowerChainTheme } from "../../../src/theme";
import { useResponsiveLayout } from "../../../src/hooks/useResponsiveLayout";
import { LAYOUT } from "../../../src/constants/layout";
import { APP_ROUTES } from "../../../src/constants/routes";

function clientRequestId() {
  return `cop_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export default function CopilotScreen() {
  const { theme } = usePowerChainTheme();
  const credits = usePwrcCredits();
  const { isMobile, horizontalPadding, contentMaxWidth } = useResponsiveLayout();

  const [value, setValue] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessageModel[]>([]);
  const activeRequest = useRef<string | null>(null);

  useEffect(() => {
    void credits.refresh();
  }, []);

  async function openConversation(id: string) {
    try {
      const thread = await getConversation(id);
      setConversationId(thread.id);
      setMessages(
        thread.messages
          .filter((message) => message.role === "assistant" || message.role === "user")
          .map((message) => ({
            id: message.id,
            role: message.role as "assistant" | "user",
            content: message.content,
            createdAt: new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: message.status === "failed" ? "failed" : "sent",
            creditReceipt: message.creditReceipt,
            mcpInvocations: message.creditReceipt?.mcpInvocations ?? message.mcpInvocations,
          })),
      );
    } catch {
      // Preserve current thread if loading another thread fails.
    }
  }

  function newConversation() {
    setConversationId(undefined);
    setMessages([]);
    setValue("");
  }

  async function stop() {
    const id = activeRequest.current;
    if (!id) return;
    try {
      await cancelCopilotMessage(id);
    } finally {
      activeRequest.current = null;
      setSending(false);
      await credits.refresh();
    }
  }

  async function send(message: string) {
    if ((credits.account?.responseRunway ?? 0) < 1) {
      router.push("/(app)/copilot-credits");
      return;
    }

    const requestId = clientRequestId();
    activeRequest.current = requestId;

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
        clientRequestId: requestId,
        message,
        context: { screen: "copilot" },
      });

      setConversationId(result.conversationId);
      credits.replaceAccount(result.creditAccount);
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
          creditReceipt: result.creditReceipt,
          mcpInvocations: result.creditReceipt.mcpInvocations ?? [],
        },
      ]);
    } catch (error) {
      const apiError = error as Error & {
        code?: string;
        status?: number;
        payload?: { error?: string; message?: string };
      };

      if (
        apiError.status === 402 ||
        apiError.payload?.error === "INSUFFICIENT_PWRC_CREDITS"
      ) {
        await credits.refresh();
        router.push("/(app)/copilot-credits");
        return;
      }

      if (
        apiError.status === 499 ||
        apiError.payload?.error === "COPILOT_GENERATION_CANCELLED"
      ) {
        setMessages((current) => [
          ...current,
          {
            id: `cancelled-${Date.now()}`,
            role: "assistant",
            content: "• Generation stopped\nNo PWRC credits were charged.",
            createdAt: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: "sent",
          },
        ]);
        await credits.refresh();
        return;
      }

      if (apiError.code === "COPILOT_ACK_STATUS_UNKNOWN") {
        setMessages((current) => [
          ...current,
          {
            id: `ack-unknown-${Date.now()}`,
            role: "assistant",
            content:
              "• Delivery confirmation uncertain\nThe generated response was not shown because its PWRC settlement status could not be confirmed. Do not resend the same task yet. Refresh the conversation and PWRC Credit Center to reconcile the request.",
            createdAt: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: "failed",
          },
        ]);
        try {
          await credits.refresh();
        } catch {
          // The acknowledgement failure may be caused by network loss.
        }
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "• Request unavailable\nIf generation did not complete, the PWRC reservation will be released automatically. Refresh credits to confirm the final accounting state.",
          createdAt: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "failed",
        },
      ]);
      await credits.refresh();
    } finally {
      activeRequest.current = null;
      setSending(false);
    }
  }

  const bottomReserve = isMobile ? LAYOUT.floatingNavHeight + 26 : 12;
  const insufficient = (credits.account?.responseRunway ?? 0) < 1;
  const messageCostLabel = credits.pricing
    ? `${formatPwrcTokens(credits.pricing.completedResponse.pwrc)} PWRC · ≈ $${credits.pricing.completedResponse.referenceUsd} ref`
    : "10,000 PWRC · ≈ $0.02 ref";

  const conversation = (
    <View style={{ flex: 1, minWidth: 0, backgroundColor: theme.colors.background }}>
      {isMobile ? (
        <View style={{ paddingHorizontal: horizontalPadding }}>
          <ConversationHeader onNewChat={newConversation} />
        </View>
      ) : null}

      <View
        style={{
          width: "100%",
          maxWidth: isMobile ? contentMaxWidth : 880,
          alignSelf: "center",
          paddingHorizontal: isMobile ? horizontalPadding : 20,
          paddingTop: 6,
          paddingBottom: 6,
        }}
      >
        <CreditBalanceBar
          account={credits.account}
          onPress={() => router.push("/(app)/copilot-credits")}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          width: "100%",
          maxWidth: isMobile ? contentMaxWidth : 880,
          alignSelf: "center",
          paddingHorizontal: isMobile ? horizontalPadding : 20,
          paddingTop: isMobile ? 0 : 12,
          paddingBottom: 12,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <QuickPrompts
            prompts={quickPrompts}
            onSelect={(item) => {
              if (item.action.kind === "route") {
                router.push(item.action.href);
              } else {
                setValue(item.action.prompt);
              }
            }}
          />
        ) : null}

        {messages.length === 0 ? (
          <View
            style={{
              marginTop: 12,
              marginBottom: 8,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <CostedSuggestionCard
              title="Review latest evidence"
              description="Summarize verified evidence, discrepancies, and provenance changes."
              onPress={() =>
                setValue("Review the latest verified evidence, discrepancies, and provenance changes.")
              }
              costLabel={messageCostLabel}
            />
            <CostedSuggestionCard
              title="Prepare operator actions"
              description="Prioritize actions that require human review before execution."
              onPress={() =>
                setValue("Prepare the highest-priority operator actions that require human review.")
              }
              costLabel={messageCostLabel}
            />
          </View>
        ) : null}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {sending ? <TypingIndicator /> : null}
      </ScrollView>

      <View
        style={{
          width: "100%",
          maxWidth: isMobile ? contentMaxWidth : 880,
          alignSelf: "center",
          paddingHorizontal: isMobile ? horizontalPadding : 20,
          paddingBottom: bottomReserve,
        }}
      >
        <MessageComposer
          value={value}
          onChangeText={setValue}
          sending={sending}
          onSend={send}
          onStop={stop}
          insufficientCredits={insufficient}
          onOpenCredits={() => router.push("/(app)/copilot-credits")}
          creditCostLabel={`${messageCostLabel.replace(" · ", " / response · ")}${
            credits.account ? ` · ${credits.account.responseRunway} left` : ""
          }`}
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
        {!isMobile ? (
          <ScreenToolbar
            eyebrow="Managed AI + MCP"
            title="Copilot"
            description="Grounded analysis with explicit PWRC accounting and read-only MCP provenance."
            showBrand={false}
            actions={[
              { label: "Credits", icon: "cash-multiple", onPress: () => router.push(APP_ROUTES.credits as never), variant: "primary" },
              { label: "Diagnostics", icon: "stethoscope", onPress: () => router.push(APP_ROUTES.diagnostics as never) },
            ]}
          />
        ) : null}
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
