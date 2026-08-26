import type { AgentDefinition } from "./types.js";
export const POWERCHAIN_AGENTS:readonly AgentDefinition[]=[
  {id:"operations",slug:"operations",name:"Operations Analyst",capabilities:["observe","analyze","prepare_action","request_evidence"],canApprove:false,canSign:false,canDispatchPhysical:false},
  {id:"energy",slug:"energy",name:"Energy Analyst",capabilities:["observe","analyze","request_evidence"],canApprove:false,canSign:false,canDispatchPhysical:false},
  {id:"settlement",slug:"settlement",name:"Settlement Reviewer",capabilities:["observe","analyze","prepare_action","request_evidence"],canApprove:false,canSign:false,canDispatchPhysical:false},
] as const;
export function getAgent(slug:string){return POWERCHAIN_AGENTS.find((agent)=>agent.slug===slug)??null;}
