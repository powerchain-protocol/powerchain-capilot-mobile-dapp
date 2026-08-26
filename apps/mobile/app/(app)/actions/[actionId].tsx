import { router, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { ScreenToolbar } from "../../../src/components/layout";
import { Card, EmptyState, Screen, Section, StatusBadge } from "../../../src/components/ui";
import { APP_ROUTES, assetDetailRoute } from "../../../src/constants/routes";
import { getActionCenterItemDemo } from "../../../src/data/operations-demo";
import { usePowerChainTheme } from "../../../src/theme";
export default function ActionDetailScreen(){const {actionId}=useLocalSearchParams<{actionId:string}>();const {theme}=usePowerChainTheme();const item=getActionCenterItemDemo(String(actionId??""));if(!item)return <Screen><EmptyState title="Action unavailable" actionLabel="Action Center" onAction={()=>router.push(APP_ROUTES.actionCenter as never)}/></Screen>;return <Screen><ScreenToolbar title={item.title} eyebrow="Action detail" description={item.summary} badge={{label:item.status.replaceAll("_"," "),tone:item.status==="blocked"?"danger":"warning"}} actions={item.assetId?[{label:"Open asset",icon:"solar-panel-large",onPress:()=>router.push(assetDetailRoute(item.assetId!) as never),variant:"primary"}]:[]}/><Section title="Authority"><Card padding="compact"><StatusBadge label={`${item.risk} risk`} tone={item.risk==="high"?"danger":item.risk==="medium"?"warning":"success"}/><Text style={{marginTop:10,fontSize:12,lineHeight:17,color:theme.colors.textMuted}}>This record is an operator task, not execution authority. Any sensitive mutation must pass policy, approval and wallet controls.</Text></Card></Section></Screen>}
