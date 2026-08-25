import { View } from "react-native";
import {
  AssetSelector,
  WalletButton,
} from "../../../src/components/web3";
import {
  ResponsiveGrid,
} from "../../../src/components/layout";
import {
  Card,
  Screen,
  Section,
} from "../../../src/components/ui";
import { useSolanaWallet } from "../../../src/integrations/solana";
import { useState } from "react";
import type { Web3AssetSymbol } from "../../../src/types/web3-assets";
import { useResponsiveLayout } from "../../../src/hooks/useResponsiveLayout";

export default function AssetsScreen() {
  const wallet = useSolanaWallet();
  const [asset, setAsset] = useState<Web3AssetSymbol>("PWRC");
  const { isMobile } = useResponsiveLayout();

  return (
    <Screen>
      <View style={{ paddingTop: isMobile ? 12 : 24 }}>
        <ResponsiveGrid minItemWidth={340} gap={16}>
          <Section title="Wallet">
            <WalletButton
              wallet="generic"
              connected={Boolean(wallet.account)}
              address={wallet.account?.address}
              disabled={!wallet.supported}
              onPress={wallet.account ? wallet.disconnect : wallet.connect}
            />
          </Section>

          <Section
            title="Assets"
            description="Supported PowerChain settlement and network assets."
          >
            <Card padding="compact">
              <AssetSelector
                value={asset}
                onChange={setAsset}
              />
            </Card>
          </Section>
        </ResponsiveGrid>
      </View>
    </Screen>
  );
}
