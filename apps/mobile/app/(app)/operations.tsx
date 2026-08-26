import { useEffect, useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { ScreenToolbar, ResponsiveGrid } from "../../src/components/layout";
import { Button, Card, Screen, Section, StatusBadge } from "../../src/components/ui";
import { AlarmList, DigitalTwinSummary, EventFeed, SiteSelector } from "../../src/components/operations";
import { exportEvidence, exportSnapshot, useOperationalSites, useSiteAlarms, useSiteEvents, useSiteTwin } from "../../src/operations";
import { siteStore, useActiveSiteId } from "../../src/store/site-store";
import { usePowerChainTheme } from "../../src/theme";

export default function OperationsScreen(){
 const{theme}=usePowerChainTheme(); const sites=useOperationalSites(); const activeSiteId=useActiveSiteId();
 const site=useMemo(()=>sites.data?.find((item)=>item.id===activeSiteId)??sites.data?.[0]??null,[sites.data,activeSiteId]);
 useEffect(()=>{if(!siteStore.getState().hydrated)void siteStore.hydrate();},[]);
 useEffect(()=>{if(!activeSiteId&&sites.data?.[0])void siteStore.setActiveSite(sites.data[0].id);},[activeSiteId,sites.data]);
 const twin=useSiteTwin(site?.id??null); const alarms=useSiteAlarms(site?.id??null); const events=useSiteEvents(site?.id??null); const[exporting,setExporting]=useState(false);
 async function runExport(kind:"evidence"|"snapshot"){if(!site)return;setExporting(true);try{if(kind==="evidence"){const value=await exportEvidence(site.id);Alert.alert("Evidence export verified",`${value.evidence.length} evidence envelopes prepared as JSON.`);}else{const value=await exportSnapshot(site.id);Alert.alert("Snapshot export verified",`Snapshot hash ${value.snapshotHash.slice(0,20)}…`);}}catch(e){Alert.alert("Export failed",e instanceof Error?e.message:"Request failed.");}finally{setExporting(false);}}
 return <Screen><ScreenToolbar eyebrow="Operational truth" title="Site Operations" description="Digital twin, telemetry-derived state, alarms, event journal and evidence exports. Physical execution remains disabled." badge={{label:twin.data?.authoritative?"LIVE":"NON-AUTHORITATIVE",tone:twin.data?.authoritative?"success":"warning"}} actions={[{label:"Refresh",icon:"refresh",onPress:()=>{void sites.refresh();void twin.refresh();void alarms.refresh();void events.refresh();}},{label:"Evidence JSON",icon:"code-json",onPress:()=>void runExport("evidence"),variant:"primary"}]}/>
 <Section title="Site" description="Access is site-scoped by the backend; this selector only changes the active authorized context.">{sites.data?.length?<SiteSelector sites={sites.data} activeSiteId={site?.id??null} onChange={(id)=>void siteStore.setActiveSite(id)}/>:<Card padding="compact"><Text style={{color:theme.colors.textMuted}}>{sites.loading?"Loading authorized sites…":"No authorized sites returned."}</Text></Card>}</Section>
 {site?<><Section title="Digital twin" description={`Per-site operational twin for ${site.name}.`}>{twin.data?<DigitalTwinSummary twin={twin.data}/>:<StateCard loading={twin.loading} error={twin.error}/>}</Section>
 <Section title="Current alarms" description="Open, acknowledged and resolved alarm state is sourced from the operational journal."><AlarmList alarms={alarms.data?.items??[]}/></Section>
 <Section title="Operational events" description="Append-only event feed; late updates remain auditable without overwriting newer state."><EventFeed events={events.data?.items??[]}/></Section>
 <Section title="Evidence & snapshots"><ResponsiveGrid minItemWidth={220}><Button label={exporting?"Preparing…":"Export evidence JSON"} disabled={exporting} onPress={()=>void runExport("evidence")}/><Button label={exporting?"Preparing…":"Export twin snapshot"} disabled={exporting} variant="secondary" onPress={()=>void runExport("snapshot")}/></ResponsiveGrid><View style={{marginTop:10}}><StatusBadge label="NO PHYSICAL EXECUTION" tone="neutral"/></View></Section></>:null}
 </Screen>
}
function StateCard({loading,error}:{loading:boolean;error:Error|null}){const{theme}=usePowerChainTheme();return <Card padding="compact"><Text style={{color:error?theme.colors.danger:theme.colors.textMuted}}>{loading?"Loading operational state…":error?.message??"No operational state available."}</Text></Card>}
