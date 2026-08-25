import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  Web3AssetSymbol,
  Web3IconVariant,
} from "../../types/web3-assets";
import { usePowerChainTheme } from "../../theme";

const pwrc = require("../../../assets/tokens/pwrc.png");

export function AssetIcon({
  symbol,
  size = 32,
}: {
  symbol: Web3AssetSymbol;
  size?: number;
  variant?: Web3IconVariant;
}) {
  const { theme } = usePowerChainTheme();

  if (symbol === "PWRC") {
    return (
      <Image
        accessibilityLabel="PowerChain icon"
        source={pwrc}
        resizeMode="contain"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    );
  }

  if (symbol === "SUI") {
    return (
      <View
        accessibilityLabel="Sui icon"
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
        <MaterialCommunityIcons
          name="water-outline"
          size={Math.round(size * 0.58)}
          color={theme.colors.text}
        />
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={`${symbol} icon`}
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
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.symbol,
          {
            maxWidth: Math.max(16, size - 8),
            color: theme.colors.text,
            fontSize: Math.max(9, Math.floor(size * 0.28)),
          },
        ]}
      >
        {symbol}
      </Text>
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
  symbol: {
    fontWeight: "700",
    textAlign: "center",
  },
});
