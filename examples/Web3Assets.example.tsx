import { useState } from "react";
import { Text, View } from "react-native";
import { Screen, Section } from "../src/components/ui";
import {
  AssetIcon,
  AssetSelector,
  NetworkIcon,
  WalletButton,
  WalletIcon,
} from "../src/components/web3";
import type { Web3AssetSymbol } from "../src/types/web3-assets";

export default function Web3AssetsExample() {
  const [asset, setAsset] =
    useState<Web3AssetSymbol>("PWRC");

  return (
    <Screen>
      <Section
        title="Assets"
        description="PowerChain settlement and supported network assets."
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <AssetIcon symbol="PWRC" size={40} />
          <AssetIcon symbol="SOL" size={40} />
          <AssetIcon symbol="USDC" size={40} />
          <AssetIcon symbol="EURC" size={40} />
          <AssetIcon symbol="SUI" size={40} />
        </View>
      </Section>

      <Section title="Networks">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <NetworkIcon network="solana" size={34} />
          <NetworkIcon network="sui" size={34} />
        </View>
      </Section>

      <Section title="Wallets">
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <WalletIcon wallet="phantom" size={34} />
          <WalletIcon wallet="solflare" size={34} />
          <WalletIcon wallet="backpack" size={34} />
          <WalletIcon wallet="ledger" size={34} />
          <WalletIcon wallet="wallet-connect" size={34} />
        </View>

        <WalletButton
          wallet="phantom"
          connected
          address="7yN9d4PowerChainExampleWalletR3dA2"
          onPress={() => {}}
        />
      </Section>

      <Section title="Asset selector">
        <AssetSelector
          value={asset}
          onChange={setAsset}
          balances={{
            PWRC: "1,250 PWRC",
            SOL: "4.28 SOL",
            USDC: "580.00 USDC",
            EURC: "120.00 EURC",
            SUI: "42.5 SUI",
          }}
        />
      </Section>

      <Text>{`Selected: ${asset}`}</Text>
    </Screen>
  );
}
