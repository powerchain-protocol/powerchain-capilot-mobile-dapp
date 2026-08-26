import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { ResponsiveGrid, ScreenToolbar } from "../../../src/components/layout";
import { Card, EmptyState, Screen, Section, StatusBadge } from "../../../src/components/ui";
import { APP_ROUTES } from "../../../src/constants/routes";
import { getOperationalAssetDemo } from "../../../src/data/operations-demo";
import { usePowerChainTheme } from "../../../src/theme";

export default function AssetDetailScreen() {
  const { assetId } = useLocalSearchParams<{assetId:string}>();
  const { theme } = usePowerChainTheme();
  const asset = getOperationalAssetDemo(String(assetId ?? ""));
  if (!asset) return <Screen><ScreenToolbar title="Asset" description="Asset detail"/><EmptyState title="Asset unavailable" description="The requested asset is not present in the current data source." actionLabel="Back to Assets" onAction={()=>router.push(APP_ROUTES.assets as never)}/></Screen>;
  return (
    <Screen>
      <ScreenToolbar
        eyebrow={`${asset.technology} asset`}
        title={asset.name}
        description={`${asset.id} · ${asset.location} · ${asset.capacity}`}
        badge={{label:asset.status,tone:asset.status === "operational" ? "success" : asset.status === "review" ? "warning" : "danger"}}
        actions={[
          {label:"Reports",icon:"file-chart-outline",onPress:()=>router.push({pathname:APP_ROUTES.reports,params:{assetId:asset.id}} as never),variant:"primary"},
          {label:"Settlement",icon:"bank-transfer",onPress:()=>router.push({pathname:APP_ROUTES.settlementReview,params:{assetId:asset.id}} as never)},
        ]}
      />
      <Section title="Operational identity">
        <ResponsiveGrid minItemWidth={260}>
          <Card padding="compact"><StatusBadge label="Physical truth" tone="success"/><Text style={{marginTop:10,fontSize:15,fontWeight:"600",color:theme.colors.text}}>{asset.evidence}</Text><Text style={{marginTop:4,fontSize:12,lineHeight:17,color:theme.colors.textMuted}}>External ACP/MCP evidence can inform review but cannot silently overwrite first-party physical evidence.</Text></Card>
          <Card padding="compact"><StatusBadge label={asset.network} tone="info"/><Text style={{marginTop:10,fontSize:15,fontWeight:"600",color:theme.colors.text}}>Settlement posture</Text><Text style={{marginTop:4,fontSize:12,lineHeight:17,color:theme.colors.textMuted}}>{asset.settlement}</Text></Card>
        </ResponsiveGrid>
      </Section>
      <Section title="Trust boundaries"><Card padding="compact"><View style={{gap:7}}><Text style={{fontSize:13,color:theme.colors.text}}>• Asset graph records identity and lifecycle.</Text><Text style={{fontSize:13,color:theme.colors.text}}>• Evidence vault records provenance and truth tier.</Text><Text style={{fontSize:13,color:theme.colors.text}}>• Copilot prepares analysis, never direct canonical mutation.</Text><Text style={{fontSize:13,color:theme.colors.text}}>• Wallet authorization remains independent of AI.</Text></View></Card></Section>
    </Screen>
  );
}
