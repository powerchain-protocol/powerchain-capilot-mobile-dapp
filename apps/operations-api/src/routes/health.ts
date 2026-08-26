import { Router } from "express";
import type { ServiceHealth, SystemHealth } from "@powerchain/energy-contracts";
import { compatibility, config } from "../config.js";
import { prisma } from "../db/prisma.js";
import { solanaReadRpc } from "../clients/solana-read.js";
import { suiReadRpc } from "../clients/sui-read.js";
import { marketDataProviderIds, marketDataProviders } from "../clients/market-data.js";

export const healthRouter = Router();
const mode = (): SystemHealth["mode"] =>
  config.OPERATIONS_DATA_MODE === "demo"
    ? "simulation"
    : config.OPERATIONS_DATA_MODE as SystemHealth["mode"];

async function timed(id:string,label:string,configured:boolean,fn:()=>Promise<unknown>):Promise<ServiceHealth>{
  const started=Date.now();
  try{await fn();return{id,label,status:"healthy",configured,latencyMs:Date.now()-started,lastSuccessfulCheckAt:new Date().toISOString()};}
  catch(error){return{id,label,status:"unavailable",configured,latencyMs:Date.now()-started,detail:error instanceof Error?error.message:"unavailable"};}
}
async function outboxHealth():Promise<ServiceHealth>{
  if(!config.SUPABASE_REALTIME_ENABLED)return{id:"supabase-realtime",label:"Supabase Realtime",status:"disabled",configured:false,detail:"Optional realtime projection disabled; durable outbox remains authoritative."};
  try{const[pending,blocked]=await Promise.all([prisma.operationalOutbox.count({where:{publishedAt:null}}),prisma.operationalOutbox.count({where:{publishedAt:null,publishAttempts:{gte:config.OUTBOX_MAX_ATTEMPTS}}})]);return{id:"supabase-realtime",label:"Supabase Realtime",status:blocked>0?"degraded":"healthy",configured:true,detail:`${pending} unpublished event(s); ${blocked} blocked after retry limit.`};}
  catch(error){return{id:"supabase-realtime",label:"Supabase Realtime",status:"degraded",configured:true,detail:error instanceof Error?error.message:"outbox health unavailable"};}
}
async function marketHealth():Promise<ServiceHealth>{
  if(!marketDataProviders.length)return{id:"market-data",label:"Market data adapters",status:"disabled",configured:false,detail:"No market-data provider adapter is enabled."};
  const results=await Promise.allSettled(marketDataProviders.map((p)=>p.health()));
  const healthy=results.filter((r)=>r.status==="fulfilled").length;
  return{id:"market-data",label:"Market data adapters",status:healthy>0?healthy===results.length?"healthy":"degraded":"unavailable",configured:true,detail:`${healthy}/${results.length} provider(s) healthy: ${marketDataProviderIds.join(", ")}.`};
}

healthRouter.get("/",async(_request,response)=>{
  const [db,solana,sui,market,realtime]=await Promise.all([
    timed("postgresql","PostgreSQL",true,()=>prisma.$queryRaw`SELECT 1`),
    timed("solana","Solana read RPC",true,()=>solanaReadRpc("getLatestBlockhash",[{commitment:"confirmed"}])),
    timed("sui","Sui read RPC",true,()=>suiReadRpc("sui_getLatestCheckpointSequenceNumber",[])),
    marketHealth(),outboxHealth(),
  ]);
  const checks:ServiceHealth[]=[db,solana,sui,market,{id:"safe-actions",label:"Safe Actions",status:"healthy",configured:true,detail:"Prepare/simulate only; physical dispatch, settlement execution and server signing remain disabled."},realtime];
  const ok=db.status==="healthy"&&solana.status!=="unavailable"&&sui.status!=="unavailable";
  response.status(ok?200:503).json({ok,service:"powerchain-operations-api",version:config.APP_VERSION,mode:mode(),compatibility,checks,checkedAt:new Date().toISOString()} satisfies SystemHealth);
});
healthRouter.get("/live",(_request,response)=>response.json({ok:true,service:"powerchain-operations-api",version:config.APP_VERSION}));
healthRouter.get("/ready",async(_request,response)=>{
  const [db,solana,sui,market]=await Promise.all([
    timed("postgresql","PostgreSQL",true,()=>prisma.$queryRaw`SELECT 1`),
    timed("solana","Solana read RPC",true,()=>solanaReadRpc("getLatestBlockhash",[{commitment:"confirmed"}])),
    timed("sui","Sui read RPC",true,()=>suiReadRpc("sui_getLatestCheckpointSequenceNumber",[])),
    marketHealth(),
  ]);
  const ready=db.status==="healthy"&&solana.status==="healthy"&&sui.status==="healthy"&&(market.status==="healthy"||market.status==="degraded"||market.status==="disabled");
  response.status(ready?200:503).json({ok:ready,compatibility,checks:[db,solana,sui,market],physicalExecution:false,settlementExecution:false});
});
