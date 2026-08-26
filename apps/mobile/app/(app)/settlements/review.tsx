import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { ResponsiveGrid, ScreenToolbar } from "../../../src/components/layout";
import { Card, EmptyState, PressableCard, Screen, Section, StatusBadge } from "../../../src/components/ui";
import { APP_ROUTES, assetDetailRoute } from "../../../src/constants/routes";
import { getSettlementReviewsDemo } from "../../../src/data/operations-demo";
import { usePowerChainTheme } from "../../../src/theme";

export default function SettlementReviewScreen() {
  const { assetId } = useLocalSearchParams<{assetId?:string}>();
  const { theme } = usePowerChainTheme();
  const all=getSettlementReviewsDemo(); const items=assetId ? all.filter((x)=>x.assetId===assetId) : all;
  return <Screen>
    <ScreenToolbar eyebrow="Execution boundary" title="Settlement review" description="Review prepared financial intent separately from human approval and wallet authorization." badge={{label:"No auto-spend",tone:"warning"}} actions={[{label:"Action Center",icon:"checkbox-marked-circle-outline",onPress:()=>router.push(APP_ROUTES.actionCenter as never)},{label:"Service health",icon:"heart-pulse",onPress:()=>router.push(APP_ROUTES.serviceHealth as never)}]}/>
    <Section title="Prepared settlements">
      {items.length ? <ResponsiveGrid minItemWidth={330}>{items.map((item)=><PressableCard key={item.id} padding="compact" onPress={()=>router.push(assetDetailRoute(item.assetId) as never)}><View style={{flexDirection:"row",gap:12}}><MaterialCommunityIcons name="bank-transfer" size={22} color={theme.colors.primary}/><View style={{flex:1,minWidth:0}}><StatusBadge label={item.state.replaceAll("_"," ")} tone={item.state === "ready" ? "success" : item.state === "reconciling" ? "warning" : "warning"}/><Text style={{marginTop:9,fontSize:15,fontWeight:"600",color:theme.colors.text}}>{item.title}</Text><Text style={{marginTop:4,fontSize:13,color:theme.colors.text}}>{item.amount} {item.asset}</Text><Text style={{marginTop:6,fontSize:12,lineHeight:17,color:theme.colors.textMuted}}>{item.authority}</Text></View><MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted}/></View></PressableCard>)}</ResponsiveGrid> : <EmptyState title="No settlements in scope" description="No prepared settlement review is available for the selected asset."/>}
    </Section>
    <Section title="Settlement doctrine"><Card padding="compact"><Text style={{fontSize:12,lineHeight:17,color:theme.colors.textMuted}}>Intent ≠ authority ≠ execution ≠ receipt. PWRC Copilot credits and asset settlement are independent accounting boundaries; neither can authorize the other.</Text></Card></Section>
  </Screen>;
}
