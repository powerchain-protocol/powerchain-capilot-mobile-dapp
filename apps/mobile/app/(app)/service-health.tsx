import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { IntegrationStatusCard } from "../../src/components/integrations";
import { ResponsiveGrid, ScreenToolbar } from "../../src/components/layout";
import { EmptyState, Screen, Section, StatusBadge } from "../../src/components/ui";
import { getIntegrationStatus } from "../../src/integrations/status";
import type { IntegrationSummary } from "../../src/types/integrations";
import { APP_ROUTES } from "../../src/constants/routes";

export default function ServiceHealthScreen(){
 const [data,setData]=useState<IntegrationSummary|null>(null); const [error,setError]=useState<string|null>(null); const [loading,setLoading]=useState(false);
 async function refresh(){setLoading(true);setError(null);try{setData(await getIntegrationStatus())}catch(e){setError(e instanceof Error?e.message:"Health unavailable") }finally{setLoading(false)}}
 useEffect(()=>{void refresh()},[]);
 return <Screen><ScreenToolbar eyebrow="Readiness" title="Service Health" description="Operational health for managed AI, chains, market-data and persistence dependencies." badge={data?{label:data.overall,tone:data.overall === "operational" ? "success" : data.overall === "degraded" ? "warning" : "danger"}:undefined} actions={[{label:loading?"Refreshing…":"Refresh",icon:"refresh",onPress:()=>void refresh(),variant:"primary"},{label:"Diagnostics",icon:"stethoscope",onPress:()=>router.push(APP_ROUTES.diagnostics as never)}]}/><Section title="Dependencies">{data?.items.length?<ResponsiveGrid minItemWidth={300}>{data.items.map(i=><IntegrationStatusCard key={i.id} integration={i}/>)}</ResponsiveGrid>:null}{!data&&!error?<Text>Checking services…</Text>:null}{error?<EmptyState title="Service health unavailable" description={error} actionLabel="Retry" onAction={refresh}/>:null}</Section></Screen>;
}
