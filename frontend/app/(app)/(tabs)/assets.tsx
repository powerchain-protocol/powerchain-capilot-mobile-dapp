import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { ScreenToolbar, ResponsiveGrid } from "../../../src/components/layout";
import { EmptyState, PressableCard, Screen, Section, StatusBadge, Card } from "../../../src/components/ui";
import { AssetSelector, WalletButton } from "../../../src/components/web3";
import { useSolanaWallet } from "../../../src/integrations/solana";
import { useState } from "react";
import type { Web3AssetSymbol } from "../../../src/types/web3-assets";
import { APP_ROUTES, assetDetailRoute } from "../../../src/constants/routes";
import { getOperationalAssetsDemo } from "../../../src/data/operations-demo";
import { mobileEnv } from "../../../src/config/env";
import { usePowerChainTheme } from "../../../src/theme";

export default function AssetsScreen() {
  const wallet = useSolanaWallet();
  const [asset, setAsset] = useState<Web3AssetSymbol>("PWRC");
  const { theme } = usePowerChainTheme();
  const assets = getOperationalAssetsDemo();

  return (
    <Screen>
      <ScreenToolbar
        eyebrow="Physical + tokenized assets"
        title="Assets"
        description="Facilities, evidence, settlement posture and supported network assets. Physical evidence remains authoritative."
        badge={{ label: mobileEnv.dataMode === "demo" ? "Demo portfolio" : "Portfolio", tone: mobileEnv.dataMode === "demo" ? "warning" : "success" }}
        actions={[
          { label:"Reports", icon:"file-chart-outline", onPress:()=>router.push(APP_ROUTES.reports as never), variant:"primary" },
          { label:"Diagnostics", icon:"stethoscope", onPress:()=>router.push(APP_ROUTES.diagnostics as never) },
        ]}
      />

      <Section title="Portfolio">
        {assets.length ? (
          <ResponsiveGrid minItemWidth={330}>
            {assets.map((item) => (
              <PressableCard key={item.id} padding="compact" onPress={()=>router.push(assetDetailRoute(item.id) as never)}>
                <View style={{ flexDirection:"row", gap:12, alignItems:"flex-start" }}>
                  <View style={{ width:40, height:40, borderRadius:10, backgroundColor:theme.colors.surfaceSubtle, alignItems:"center", justifyContent:"center" }}>
                    <MaterialCommunityIcons name={item.technology === "Solar" ? "solar-panel-large" : item.technology === "Wind" ? "wind-turbine" : item.technology === "Battery" ? "battery-charging-outline" : "ev-station"} size={22} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex:1, minWidth:0 }}>
                    <View style={{ flexDirection:"row", gap:7, flexWrap:"wrap" }}>
                      <StatusBadge label={item.status} tone={item.status === "operational" ? "success" : item.status === "review" ? "warning" : "danger"} />
                      <StatusBadge label={item.network} tone="info" />
                    </View>
                    <Text style={{ marginTop:9, fontSize:15, fontWeight:"600", color:theme.colors.text }}>{item.name}</Text>
                    <Text style={{ marginTop:3, fontSize:12, color:theme.colors.textMuted }}>{item.technology} · {item.capacity} · {item.location}</Text>
                    <Text style={{ marginTop:7, fontSize:12, lineHeight:17, color:theme.colors.textMuted }}>{item.evidence}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
                </View>
              </PressableCard>
            ))}
          </ResponsiveGrid>
        ) : (
          <EmptyState title="No connected asset graph" description="Production asset data is not represented by demo cards. Connect the authoritative asset/RWA API or switch to demo mode for interaction testing." />
        )}
      </Section>

      <Section title="Settlement wallet and assets">
        <ResponsiveGrid minItemWidth={330}>
          <Card padding="compact">
            <WalletButton wallet="generic" connected={Boolean(wallet.account)} address={wallet.account?.address} disabled={!wallet.supported} onPress={wallet.account ? wallet.disconnect : wallet.connect} />
          </Card>
          <Card padding="compact">
            <AssetSelector value={asset} onChange={setAsset} />
          </Card>
        </ResponsiveGrid>
      </Section>
    </Screen>
  );
}
