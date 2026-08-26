import {
  StyleSheet,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  Web3IconVariant,
  Web3WalletId,
} from "../../types/web3-assets";
import { web3Wallets } from "../../data/web3-assets";
import { usePowerChainTheme } from "../../theme";

export function WalletIcon({
  wallet = "generic",
  size = 28,
}: {
  wallet?: Web3WalletId;
  size?: number;
  variant?: Web3IconVariant;
}) {
  const { theme } = usePowerChainTheme();
  const item = web3Wallets[wallet];

  return (
    <View
      accessibilityLabel={`${item.name} wallet`}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: Math.min(10, size / 2),
          backgroundColor: theme.colors.surfaceSubtle,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <MaterialCommunityIcons
        name="wallet-outline"
        size={Math.round(size * 0.58)}
        color={theme.colors.text}
      />
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
});
