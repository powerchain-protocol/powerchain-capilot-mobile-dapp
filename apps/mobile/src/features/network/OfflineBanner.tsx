import { StyleSheet, Text, View } from "react-native";
import { usePowerChainTheme } from "../../theme";
import { useNetworkStatus } from "./NetworkProvider";

export function OfflineBanner() {
  const { connected, internetReachable } = useNetworkStatus();
  const { theme } = usePowerChainTheme();

  if (connected && internetReachable) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.warning,
        },
      ]}
    >
      <Text style={styles.text}>
        Offline • Showing locally available information
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  text: {
    color: "#101412",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
