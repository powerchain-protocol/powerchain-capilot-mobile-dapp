import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { ScreenToolbar, ResponsiveGrid } from "../../../src/components/layout";
import { Card, PressableCard, Screen, Section, StatusBadge } from "../../../src/components/ui";
import { usePwrcCredits, formatPwrcTokens } from "../../../src/features/credits";
import { mobileEnv } from "../../../src/config/env";
import { APP_ROUTES } from "../../../src/constants/routes";
import { getActionCenterDemo, getOperationalAssetsDemo } from "../../../src/data/operations-demo";
import { usePowerChainTheme } from "../../../src/theme";

function NavCard({ title, description, icon, value, onPress }: { title:string; description:string; icon:keyof typeof MaterialCommunityIcons.glyphMap; value?:string; onPress:()=>void }) {
  const { theme } = usePowerChainTheme();
  return (
    <PressableCard padding="compact" onPress={onPress}>
      <View style={{ flexDirection:"row", alignItems:"flex-start", gap:12 }}>
        <View style={{ width:38, height:38, borderRadius:10, alignItems:"center", justifyContent:"center", backgroundColor:theme.colors.surfaceSubtle }}>
          <MaterialCommunityIcons name={icon} size={20} color={theme.colors.primary} />
        </View>
        <View style={{ flex:1, minWidth:0 }}>
          <View style={{ flexDirection:"row", gap:8, justifyContent:"space-between", alignItems:"center" }}>
            <Text style={{ fontSize:15, lineHeight:21, fontWeight:"600", color:theme.colors.text }}>{title}</Text>
            {value ? <Text style={{ fontSize:13, fontWeight:"700", color:theme.colors.text }}>{value}</Text> : null}
          </View>
          <Text style={{ marginTop:4, fontSize:12, lineHeight:17, color:theme.colors.textMuted }}>{description}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
      </View>
    </PressableCard>
  );
}

export default function HomeScreen() {
  const { theme } = usePowerChainTheme();
  const credits = usePwrcCredits();
  const actions = getActionCenterDemo();
  const assets = getOperationalAssetsDemo();
  const pending = actions.filter((item) => item.status === "needs_review" || item.status === "blocked").length;
  const runway = credits.account?.responseRunway;

  return (
    <Screen>
      <ScreenToolbar
        eyebrow="PowerChain operations"
        title="Overview"
        description="One operational surface for decisions, approvals, assets, AI, settlement and infrastructure health."
        badge={{ label: mobileEnv.dataMode === "demo" ? "Demo data" : mobileEnv.dataMode.toUpperCase(), tone: mobileEnv.dataMode === "demo" ? "warning" : "success" }}
        actions={[
          { label:"Batch review", icon:"checkbox-multiple-marked-outline", onPress:()=>router.push(APP_ROUTES.batchApprovals as never) },
          { label:"Reports", icon:"file-chart-outline", onPress:()=>router.push(APP_ROUTES.reports as never), variant:"primary" },
        ]}
      />

      <Section title="Needs attention" description="Prepared work remains separate from approval and wallet authorization.">
        <ResponsiveGrid minItemWidth={250}>
          <NavCard title="Action Center" description="Approvals, reviews, reconciliation issues and operator updates." icon="checkbox-marked-circle-outline" value={mobileEnv.dataMode === "demo" ? String(pending) : undefined} onPress={()=>router.push(APP_ROUTES.actionCenter as never)} />
          <NavCard title="Assets" description="Renewable assets, evidence, settlement state and network identity." icon="solar-panel-large" value={mobileEnv.dataMode === "demo" ? String(assets.length) : undefined} onPress={()=>router.push(APP_ROUTES.assets as never)} />
          <NavCard title="Energy / EMS" description="Generation, demand, storage, grid exchange and live physical flow." icon="transmission-tower" onPress={()=>router.push(APP_ROUTES.energy as never)} />
          <NavCard title="Operational Twin" description="Authorized site twin, freshness, alarms, event journal and evidence snapshots." icon="vector-combine" onPress={()=>router.push(APP_ROUTES.operations as never)} />
          <NavCard title="Service Health" description="AI providers, Solana, Sui, databases and dependent services." icon="heart-pulse" onPress={()=>router.push(APP_ROUTES.serviceHealth as never)} />
          <NavCard title="PWRC Credits" description="Balance, runway, Solana Pay funding and message receipts." icon="cash-multiple" value={runway != null ? `${runway} msgs` : undefined} onPress={()=>router.push(APP_ROUTES.credits as never)} />
        </ResponsiveGrid>
      </Section>

      <Section title="Control plane">
        <Card padding="compact">
          <ResponsiveGrid minItemWidth={220} gap={8}>
            <Text style={{ fontSize:14, lineHeight:20, color:theme.colors.text }}>• Physical systems provide truth.</Text>
            <Text style={{ fontSize:14, lineHeight:20, color:theme.colors.text }}>• AI prepares decisions and can use read-only MCP tools.</Text>
            <Text style={{ fontSize:14, lineHeight:20, color:theme.colors.text }}>• Humans approve sensitive actions.</Text>
            <Text style={{ fontSize:14, lineHeight:20, color:theme.colors.text }}>• Wallets authorize financial execution.</Text>
          </ResponsiveGrid>
        </Card>
      </Section>

      <Section title="Copilot economics" action={<StatusBadge label="1 MSG UNIT" tone="info" />}>
        <Card padding="compact">
          <Text style={{ fontSize:15, fontWeight:"600", color:theme.colors.text }}>10,000 PWRC per completed delivered response</Text>
          <Text style={{ marginTop:4, fontSize:12, lineHeight:17, color:theme.colors.textMuted }}>
            MCP reads, provider fallback and internal retries do not create additional message charges. Failed or abandoned generation releases the reservation.
          </Text>
          {credits.account ? (
            <Text style={{ marginTop:10, fontSize:13, color:theme.colors.text }}>
              Available: {formatPwrcTokens(credits.account.available)} PWRC · runway {credits.account.responseRunway} responses
            </Text>
          ) : null}
        </Card>
      </Section>
    </Screen>
  );
}
