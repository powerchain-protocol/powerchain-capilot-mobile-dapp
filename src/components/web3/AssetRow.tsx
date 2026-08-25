import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Web3AssetSymbol } from "../../types/web3-assets";
import { web3Assets, web3Networks } from "../../data/web3-assets";
import { usePowerChainTheme } from "../../theme";
import { AssetIcon } from "./AssetIcon";
import { NetworkIcon } from "./NetworkIcon";

export function AssetRow({
  symbol,
  balance,
  selected = false,
  onPress,
}: {
  symbol: Web3AssetSymbol;
  balance?: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { theme } = usePowerChainTheme();
  const asset = web3Assets[symbol];
  const network = web3Networks[asset.network];

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: selected
            ? theme.colors.primary
            : theme.colors.border,
          backgroundColor: selected
            ? theme.colors.surfaceSubtle
            : theme.colors.surface,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <AssetIcon symbol={symbol} size={36} />

      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text
            numberOfLines={1}
            style={[styles.symbol, { color: theme.colors.text }]}
          >
            {asset.symbol}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.name, { color: theme.colors.textMuted }]}
          >
            {asset.name}
          </Text>
        </View>

        <View style={styles.networkRow}>
          <NetworkIcon network={asset.network} size={16} />
          <Text
            numberOfLines={1}
            style={[styles.network, { color: theme.colors.textMuted }]}
          >
            {network.shortName}
          </Text>
        </View>
      </View>

      {balance ? (
        <Text
          numberOfLines={1}
          style={[styles.balance, { color: theme.colors.text }]}
        >
          {balance}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    minWidth: 0,
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  symbol: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
  },
  networkRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  network: {
    fontSize: 11,
    lineHeight: 15,
  },
  balance: {
    maxWidth: "35%",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    textAlign: "right",
  },
});
