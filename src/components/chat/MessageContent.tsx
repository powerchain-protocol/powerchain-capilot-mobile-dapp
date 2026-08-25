import { StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../../theme/tokens";
import { usePowerChainTheme } from "../../theme";
import { normalizeCopilotMessage } from "./message-format";

export function MessageContent({
  content,
  inverse = false,
}: {
  content: string;
  inverse?: boolean;
}) {
  const { theme } = usePowerChainTheme();
  const lines = normalizeCopilotMessage(content);

  const textColor = inverse
    ? theme.colors.primaryForeground
    : theme.colors.text;

  const mutedColor = inverse
    ? "rgba(255,255,255,0.78)"
    : theme.colors.textMuted;

  return (
    <View style={styles.content}>
      {lines.map((line, index) => {
        if (line.type === "spacer") {
          return <View key={index} style={styles.spacer} />;
        }

        if (line.type === "title") {
          return (
            <View key={index} style={styles.titleRow}>
              <Text style={[styles.bullet, { color: textColor }]}>•</Text>
              <Text
                selectable
                style={[styles.title, { color: textColor }]}
              >
                {line.text}
              </Text>
            </View>
          );
        }

        if (line.type === "bullet") {
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: mutedColor }]}>•</Text>
              <Text
                selectable
                style={[styles.body, { color: textColor }]}
              >
                {line.text}
              </Text>
            </View>
          );
        }

        return (
          <Text
            key={index}
            selectable
            style={[styles.body, { color: textColor }]}
          >
            {line.text}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    minWidth: 0,
    gap: spacing.xs,
  },
  titleRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: 2,
  },
  bulletRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  bullet: {
    ...typography.body,
    width: 8,
    flexShrink: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  body: {
    ...typography.body,
    flexShrink: 1,
  },
  spacer: {
    height: spacing.xs,
  },
});
