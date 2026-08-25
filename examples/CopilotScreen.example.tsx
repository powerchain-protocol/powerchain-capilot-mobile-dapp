import { useState } from "react";
import { ScrollView, View } from "react-native";
import {
  ChatErrorState,
  ChatMessage,
  ConversationHeader,
  MessageActions,
  MessageComposer,
  QuickPrompts,
  TypingIndicator,
} from "../src/components/chat";
import { quickPrompts } from "../src/data/quick-prompts";

export default function CopilotScreenV3Example() {
  const [value, setValue] = useState("");
  const [streaming, setStreaming] = useState(false);

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <ConversationHeader
        onMenu={() => {}}
        onNewChat={() => {}}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <QuickPrompts
          prompts={quickPrompts}
          onSelect={(item) => setValue(item.prompt)}
        />

        <ChatMessage
          message={{
            id: "assistant-1",
            role: "assistant",
            content:
              "## Energy overview\nVerified renewable generation is stable.\n* Solar production is above baseline\n* Battery reserve is available\n## Recommended action\nReview the evidence package before settlement.",
            createdAt: "20:10",
          }}
        />

        <MessageActions
          actions={[
            {
              id: "copy",
              label: "Copy",
              icon: "content-copy",
              onPress: () => {},
            },
            {
              id: "regenerate",
              label: "Regenerate",
              icon: "refresh",
              onPress: () => {},
            },
          ]}
        />

        {streaming ? <TypingIndicator /> : null}

        <ChatErrorState
          title="Evidence temporarily unavailable"
          description="The evidence service did not return a complete response."
          onRetry={() => {}}
        />
      </ScrollView>

      <View style={{ paddingBottom: 12 }}>
        <MessageComposer
          value={value}
          onChangeText={setValue}
          sending={streaming}
          onSend={async () => {
            setStreaming(true);
            setValue("");
          }}
        />
      </View>
    </View>
  );
}
