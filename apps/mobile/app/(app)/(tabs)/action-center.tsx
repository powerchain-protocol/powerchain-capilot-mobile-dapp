import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { ScreenToolbar, ResponsiveGrid } from "../../../src/components/layout";
import { EmptyState, PressableCard, Screen, Section, StatusBadge } from "../../../src/components/ui";
import { APP_ROUTES } from "../../../src/constants/routes";
import { getActionCenterDemo } from "../../../src/data/operations-demo";
import { mobileEnv } from "../../../src/config/env";
import { usePowerChainTheme } from "../../../src/theme";

function tone(status:string) { return status === "blocked" ? "danger" : status === "needs_review" ? "warning" : status === "ready" ? "success" : "info" as const; }

export default function ActionCenterScreen() {
  const { theme } = usePowerChainTheme();
  const items = getActionCenterDemo();

  return (
    <Screen>
      <ScreenToolbar
        eyebrow="Operator workflow"
        title="Action Center"
        description="One queue for approvals, deliverable review, settlement review, reconciliation exceptions and informational updates."
        badge={{ label: mobileEnv.dataMode === "demo" ? "Demo queue" : "Operational queue", tone: mobileEnv.dataMode === "demo" ? "warning" : "success" }}
        actions={[
          { label:"Batch review", icon:"checkbox-multiple-marked-outline", onPress:()=>router.push(APP_ROUTES.batchApprovals as never), variant:"primary" },
          { label:"Settlement review", icon:"bank-transfer", onPress:()=>router.push(APP_ROUTES.settlementReview as never) },
        ]}
      />

      <Section title="Needs attention" description="Selection never grants execution authority by itself.">
        {items.length ? (
          <ResponsiveGrid minItemWidth={330}>
            {items.map((item) => (
              <PressableCard key={item.id} padding="compact" onPress={()=>router.push(item.route as never)}>
                <View style={{ flexDirection:"row", gap:12, alignItems:"flex-start" }}>
                  <MaterialCommunityIcons name={item.category === "approval" ? "check-decagram-outline" : item.category === "settlement" ? "bank-transfer" : item.category === "health" ? "heart-pulse" : "file-document-check-outline"} size={22} color={theme.colors.primary} />
                  <View style={{ flex:1, minWidth:0 }}>
                    <View style={{ flexDirection:"row", flexWrap:"wrap", gap:7, alignItems:"center" }}>
                      <StatusBadge label={item.status.replaceAll("_", " ")} tone={tone(item.status)} />
                      <StatusBadge label={`${item.risk} risk`} tone={item.risk === "high" ? "danger" : item.risk === "medium" ? "warning" : "success"} />
                    </View>
                    <Text style={{ marginTop:10, fontSize:15, lineHeight:21, fontWeight:"600", color:theme.colors.text }}>{item.title}</Text>
                    <Text style={{ marginTop:4, fontSize:12, lineHeight:17, color:theme.colors.textMuted }}>{item.summary}</Text>
                    <Text style={{ marginTop:8, fontSize:11, lineHeight:15, color:theme.colors.textMuted }}>Due {item.dueLabel}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
                </View>
              </PressableCard>
            ))}
          </ResponsiveGrid>
        ) : (
          <EmptyState title="No connected action feed" description="Connect the production approvals/action-center source. Demo queue items are only shown when EXPO_PUBLIC_DATA_MODE=demo." actionLabel="Open service health" onAction={()=>router.push(APP_ROUTES.serviceHealth as never)} />
        )}
      </Section>
    </Screen>
  );
}
