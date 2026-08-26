import type { SiteDigitalTwin, HealthCountSummary, AlarmCountSummary } from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";
import { getEmsOverview } from "./ems.js";
import { stableHash } from "../lib/stable-hash.js";
import { config } from "../config.js";
import { assertResourceSite } from "../auth/site-access.js";

function deviceCounts(rows: Array<{connectivity:string}>): HealthCountSummary {
  let healthy=0,degraded=0,offline=0,unknown=0;
  for (const row of rows) {
    const s=row.connectivity.toUpperCase();
    if (["ONLINE","HEALTHY","CONNECTED"].includes(s)) healthy++;
    else if (["DEGRADED","LIMITED","WARNING"].includes(s)) degraded++;
    else if (["OFFLINE","DISCONNECTED"].includes(s)) offline++;
    else unknown++;
  }
  return { total: rows.length, healthy, degraded, offline, unknown };
}
function nodeCounts(rows: Array<{status:string}>): HealthCountSummary {
  return deviceCounts(rows.map((r)=>({connectivity:r.status})));
}

export async function buildSiteDigitalTwin(organizationId:string,siteId:string):Promise<SiteDigitalTwin>{
  await assertResourceSite(organizationId,siteId);
  const [ems,devices,nodes,alarmRows,latestReceipt,latestEvent]=await Promise.all([
    getEmsOverview(organizationId,siteId),
    prisma.iotDevice.findMany({where:{organizationId,siteId},select:{connectivity:true,lastSeenAt:true}}),
    prisma.depinNode.findMany({where:{organizationId,siteId},select:{status:true,lastHeartbeatAt:true}}),
    prisma.operationalAlarm.groupBy({by:["status","severity"],where:{organizationId,siteId},_count:{_all:true}}),
    prisma.telemetryIngestionReceipt.findFirst({where:{organizationId,siteId},orderBy:{receivedAt:"desc"}}),
    prisma.operationalEventJournal.findFirst({where:{organizationId,siteId},orderBy:{receivedAt:"desc"}}),
  ]);
  const iot=deviceCounts(devices);
  const depin=nodeCounts(nodes);
  const alarms:AlarmCountSummary={open:0,acknowledged:0,resolved:0,criticalOpen:0};
  for(const row of alarmRows){
    const n=row._count._all;
    if(row.status==="open") alarms.open+=n;
    else if(row.status==="acknowledged") alarms.acknowledged+=n;
    else if(row.status==="resolved") alarms.resolved+=n;
    if(row.status==="open"&&row.severity==="critical") alarms.criticalOpen+=n;
  }
  const reasons:string[]=[];
  let operationalState:SiteDigitalTwin["operationalState"]="healthy";
  if(alarms.criticalOpen>0){operationalState="critical";reasons.push("CRITICAL_ALARM_OPEN");}
  else if(iot.offline>0||depin.offline>0||iot.degraded>0||depin.degraded>0){operationalState="degraded";reasons.push("OPERATIONAL_COMPONENT_DEGRADED");}
  else if(!ems&&iot.total===0&&depin.total===0){operationalState="unknown";reasons.push("NO_OPERATIONAL_STATE_AVAILABLE");}
  const mode=config.OPERATIONS_DATA_MODE==="demo"?"simulation":config.OPERATIONS_DATA_MODE as SiteDigitalTwin["mode"];
  const twin:SiteDigitalTwin={
    schemaVersion:"1.0.0",organizationId,siteId,asOf:new Date().toISOString(),operationalState,mode,
    authoritative:mode==="live",ems,iot,depin,alarms,reasons,
    sourceWatermarks:{
      telemetry:{observedAt:latestReceipt?.observedAt.toISOString(),receivedAt:latestReceipt?.receivedAt.toISOString(),sequence:latestReceipt?String(latestReceipt.sourceSequence):undefined},
      events:{observedAt:latestEvent?.observedAt.toISOString(),receivedAt:latestEvent?.receivedAt.toISOString(),sequence:latestEvent?.sourceSequence==null?undefined:String(latestEvent.sourceSequence)},
    },
  };
  return twin;
}

export async function snapshotSiteDigitalTwin(organizationId:string,siteId:string){
  const twin=await buildSiteDigitalTwin(organizationId,siteId);
  const payloadHash=stableHash(twin);
  const row=await prisma.digitalTwinSnapshot.create({data:{
    organizationId,siteId,asOf:new Date(twin.asOf),operationalState:twin.operationalState,mode:twin.mode,authoritative:twin.authoritative,
    emsState:(twin.ems??{}) as any,iotHealth:twin.iot as any,depinHealth:twin.depin as any,alarmCounts:twin.alarms as any,reasons:twin.reasons as any,sourceWatermarks:twin.sourceWatermarks as any,payloadHash,
  }});
  return {twin,snapshotHash:row.payloadHash,snapshotId:row.id};
}
