import { StyleSheet, View } from "react-native";
import { radius, spacing } from "../../theme/tokens";
import { usePowerChainTheme } from "../../theme";
import { ChatAvatar } from "./ChatAvatar";

function Line({
  width,
  color,
}: {
  width: `${number}%` | number;
  color: string;
}) {
  return (
    <View
      style={[
        styles.line,
        {
          width,
          backgroundColor: color,
        },
      ]}
    />
  );
}

function SkeletonMessage({
  role,
  widths,
}: {
  role: "assistant" | "user";
  widths: Array<`${number}%` | number>;
}) {
  const assistant = role === "assistant";
  const { theme } = usePowerChainTheme();

  return (
    <View
      style={[
        styles.row,
        assistant ? styles.assistantRow : styles.userRow,
      ]}
      accessibilityLabel="Loading message"
    >
      {assistant ? <ChatAvatar role="assistant" /> : null}

      <View
        style={[
          styles.bubble,
          {
            backgroundColor: assistant
              ? theme.colors.surface
              : theme.colors.surfaceSubtle,
            borderColor: theme.colors.border,
            borderTopLeftRadius: assistant ? radius.sm : radius.lg,
            borderTopRightRadius: assistant ? radius.lg : radius.sm,
          },
        ]}
      >
        {widths.map((width, index) => (
          <Line
            key={index}
            width={width}
            color={theme.colors.skeleton}
          />
        ))}
      </View>

      {!assistant ? <ChatAvatar role="user" /> : null}
    </View>
  );
}

export function ChatSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonMessage
        role="assistant"
        widths={["74%", "92%", "58%"]}
      />
      <SkeletonMessage
        role="user"
        widths={["84%", "62%"]}
      />
      <SkeletonMessage
        role="assistant"
        widths={["66%", "88%", "78%", "44%"]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minWidth: 0,
    gap: spacing.sm,
  },
  row: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  bubble: {
    width: "76%",
    maxWidth: 420,
    minWidth: 0,
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  line: {
    height: 10,
    borderRadius: radius.xs,
  },
});
