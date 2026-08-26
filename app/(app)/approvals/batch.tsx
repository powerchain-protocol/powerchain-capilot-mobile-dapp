import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { ResponsiveGrid, ScreenToolbar } from "../../../src/components/layout";
import { Card, PressableCard, Screen, Section, StatusBadge } from "../../../src/components/ui";
import { APP_ROUTES, assetDetailRoute } from "../../../src/constants/routes";
import { getActionCenterDemo } from "../../../src/data/operations-demo";
import { usePowerChainTheme } from "../../../src/theme";

export default function BatchApprovalsScreen() {
  const { theme } = usePowerChainTheme();
  const approvals = getActionCenterDemo().filter((item) => item.category === "approval" || item.category === "evidence");
  return (
    <Screen>
      <ScreenToolbar
        eyebrow="Approval workflow"
        title="Batch approval review"
        description="Review multiple prepared decisions together. This surface does not bypass policy, approval authority or wallet signing."
        badge={{ label:"Review only", tone:"warning" }}
        actions={[
          {label:"Settlement review",icon:"bank-transfer",onPress:()=>router.push(APP_ROUTES.settlementReview as never),variant:"primary"},
          {label:"Action Center",icon:"checkbox-marked-circle-outline",onPress:()=>router.push(APP_ROUTES.actionCenter as never)},
        ]}
      />
      <Section title="Prepared items" description="Each item retains its own evidence and authorization boundary.">
        <ResponsiveGrid minItemWidth={330}>
          {approvals.map((item)=>(
            <PressableCard key={item.id} padding="compact" onPress={()=>item.assetId ? router.push(assetDetailRoute(item.assetId) as never) : undefined}>
              <View style={{flexDirection:"row",gap:12,alignItems:"flex-start"}}>
                <MaterialCommunityIcons name="check-decagram-outline" size={22} color={theme.colors.primary}/>
                <View style={{flex:1,minWidth:0}}>
                  <StatusBadge label={item.status.replaceAll("_"," ")} tone={item.status === "blocked" ? "danger" : "warning"}/>
                  <Text style={{marginTop:10,fontSize:15,fontWeight:"600",color:theme.colors.text}}>{item.title}</Text>
                  <Text style={{marginTop:4,fontSize:12,lineHeight:17,color:theme.colors.textMuted}}>{item.summary}</Text>
                  <Text style={{marginTop:8,fontSize:11,color:theme.colors.textMuted}}>Authority: human approval remains required</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted}/>
              </View>
            </PressableCard>
          ))}
        </ResponsiveGrid>
      </Section>
      <Section title="Batch control">
        <Card padding="compact"><Text style={{fontSize:12,lineHeight:17,color:theme.colors.textMuted}}>Batch review groups evidence and decisions for operator efficiency. It never converts multiple approvals into one implicit wallet authorization.</Text></Card>
      </Section>
    </Screen>
  );
}
