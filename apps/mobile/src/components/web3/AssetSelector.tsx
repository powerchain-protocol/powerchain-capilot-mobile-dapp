import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Web3AssetSymbol } from "../../types/web3-assets";
import { supportedAssetOrder } from "../../data/web3-assets";
import { usePowerChainTheme } from "../../theme";
import { AssetRow } from "./AssetRow";

export function AssetSelector({
  value,
  onChange,
  assets = supportedAssetOrder,
  balances,
}: {
  value?: Web3AssetSymbol;
  onChange: (value: Web3AssetSymbol) => void;
  assets?: Web3AssetSymbol[];
  balances?: Partial<Record<Web3AssetSymbol, string>>;
}) {
  const { theme } = usePowerChainTheme();

  return (
    <View style={styles.base}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Select asset
      </Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {assets.map((symbol) => (
          <AssetRow
            key={symbol}
            symbol={symbol}
            selected={symbol === value}
            balance={balances?.[symbol]}
            onPress={() => onChange(symbol)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    minWidth: 0,
  },
  title: {
    marginBottom: 10,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
  },
  list: {
    width: "100%",
  },
  content: {
    gap: 8,
    paddingBottom: 8,
  },
});
