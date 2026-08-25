import { View } from "react-native";
import { Screen } from "../src/components/ui";
import {
  ChatMessage,
  ChatSkeleton,
} from "../src/components/chat";
import { ChartCard } from "../src/components/charts";
import { copilotCharts } from "../src/data/charts";
import { spacing } from "../src/theme/tokens";

export default function CopilotThreadExample() {
  return (
    <Screen>
      <View style={{ gap: spacing.md }}>
        <ChatMessage
          message={{
            id: "1",
            role: "assistant",
            content:
              "## Energy overview\nSolar generation is above the morning baseline.\n* 4.28 MWh verified solar generation\n* 3.16 MWh verified wind generation\n## Recommended action\nReview the generation evidence before settlement.",
            createdAt: "20:04",
          }}
        />

        <ChartCard chart={copilotCharts.generationToday} />

        <ChatMessage
          message={{
            id: "2",
            role: "user",
            content: "Open the evidence summary.",
            createdAt: "20:05",
          }}
        />

        <ChatSkeleton />
      </View>
    </Screen>
  );
}
