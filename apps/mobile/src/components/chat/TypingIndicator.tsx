import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { ChatAvatar } from "./ChatAvatar";
import { usePowerChainTheme } from "../../theme";

function Dot({
  delay,
  color,
}: {
  delay: number;
  color: string;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

export function TypingIndicator() {
  const { theme } = usePowerChainTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          width: "100%",
          minWidth: 0,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
          paddingVertical: 8,
        },
        bubble: {
          minHeight: 38,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          borderRadius: 12,
          borderTopLeftRadius: 8,
          backgroundColor: theme.colors.surface,
        },
      }),
    [theme],
  );

  return (
    <View
      accessibilityLabel="PowerChain Copilot is responding"
      accessibilityRole="progressbar"
      style={styles.row}
    >
      <ChatAvatar role="assistant" />
      <View style={styles.bubble}>
        <Dot delay={0} color={theme.colors.textMuted} />
        <Dot delay={120} color={theme.colors.textMuted} />
        <Dot delay={240} color={theme.colors.textMuted} />
      </View>
    </View>
  );
}
