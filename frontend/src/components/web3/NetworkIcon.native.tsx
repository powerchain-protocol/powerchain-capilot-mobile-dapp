import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  Web3IconVariant,
  Web3NetworkId,
} from "../../types/web3-assets";
import { web3Networks } from "../../data/web3-assets";
import { usePowerChainTheme } from "../../theme";

export function NetworkIcon({
  network,
  size = 28,
}: {
  network: Web3NetworkId;
  size?: number;
  variant?: Web3IconVariant;
}) {
  const { theme } = usePowerChainTheme();
  const item = web3Networks[network];

  return (
    <View
      accessibilityLabel={`${item.name} network`}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {network === "sui" ? (
        <MaterialCommunityIcons
          name="water-outline"
          size={Math.round(size * 0.58)}
          color={theme.colors.text}
        />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.text,
              fontSize: Math.max(9, Math.floor(size * 0.3)),
            },
          ]}
        >
          SOL
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontWeight: "700",
  },
});
