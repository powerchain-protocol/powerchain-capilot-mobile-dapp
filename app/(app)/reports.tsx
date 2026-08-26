import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { ResponsiveGrid, ScreenToolbar } from "../../src/components/layout";
import { EmptyState, PressableCard, Screen, Section, StatusBadge } from "../../src/components/ui";
import { APP_ROUTES } from "../../src/constants/routes";
import { getReportsDemo } from "../../src/data/operations-demo";
import { usePowerChainTheme } from "../../src/theme";

export default function ReportsScreen() {
  const { assetId } = useLocalSearchParams<{assetId?:string}>();
  const { theme } = usePowerChainTheme();
  const reports=getReportsDemo();
  return <Screen>
    <ScreenToolbar eyebrow="Audit evidence" title="Reports" description={assetId ? `Report workspace scoped to ${assetId}.` : "Operational, RWA evidence and settlement-control reports."} actions={[{label:"Assets",icon:"solar-panel-large",onPress:()=>router.push(APP_ROUTES.assets as never)},{label:"Open Copilot",icon:"robot-outline",onPress:()=>router.push(APP_ROUTES.copilot as never),variant:"primary"}]}/>
    <Section title="Available reports" description="Demo entries are clearly separated from connected production evidence.">
      {reports.length ? <ResponsiveGrid minItemWidth={320}>{reports.map((report)=><PressableCard key={report.id} padding="compact" onPress={()=>router.push(APP_ROUTES.copilot as never)}><View style={{flexDirection:"row",gap:12}}><MaterialCommunityIcons name="file-chart-outline" size={22} color={theme.colors.primary}/><View style={{flex:1,minWidth:0}}><StatusBadge label={report.status} tone={report.status === "ready" ? "success" : "warning"}/><Text style={{marginTop:9,fontSize:15,fontWeight:"600",color:theme.colors.text}}>{report.title}</Text><Text style={{marginTop:4,fontSize:12,color:theme.colors.textMuted}}>{report.scope} · {report.period}</Text><Text style={{marginTop:6,fontSize:11,color:theme.colors.textMuted}}>Updated {report.updated} · tap to discuss in Copilot</Text></View><MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted}/></View></PressableCard>)}</ResponsiveGrid> : <EmptyState title="No connected report source" description="Connect report generation/evidence services or use demo mode to test the interaction flow."/>}
    </Section>
  </Screen>;
}
