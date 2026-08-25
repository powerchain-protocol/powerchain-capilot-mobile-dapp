import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Web3WalletId } from "../../types/web3-assets";
import { web3Wallets } from "../../data/web3-assets";
import { usePowerChainTheme } from "../../theme";
import { WalletIcon } from "./WalletIcon";

export function WalletButton({
  wallet = "generic",
  connected = false,
  address,
  disabled = false,
  onPress,
}: {
  wallet?: Web3WalletId;
  connected?: boolean;
  address?: string;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const { theme } = usePowerChainTheme();
  const item = web3Wallets[wallet];

  const addressLabel =
    address && address.length > 12
      ? `${address.slice(0, 5)}…${address.slice(-5)}`
      : address;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        connected ? `Connected ${item.name} wallet` : `Connect ${item.name}`
      }
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: theme.colors.border,
          backgroundColor: connected
            ? theme.colors.surfaceSubtle
            : theme.colors.surface,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        },
      ]}
    >
      <WalletIcon wallet={wallet} size={30} />

      <View style={styles.copy}>
        <Text
          numberOfLines={1}
          style={[styles.label, { color: theme.colors.text }]}
        >
          {connected ? item.name : `Connect ${item.name}`}
        </Text>

        {addressLabel ? (
          <Text
            numberOfLines={1}
            style={[styles.address, { color: theme.colors.textMuted }]}
          >
            {addressLabel}
          </Text>
        ) : null}
      </View>

      <Text
        style={[
          styles.state,
          {
            color: connected
              ? theme.colors.success
              : theme.colors.textMuted,
          },
        ]}
      >
        {connected ? "Connected" : "Connect"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minWidth: 0,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  address: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
  },
  state: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },
});
