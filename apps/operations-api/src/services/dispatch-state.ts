import type { DispatchPreparation, DispatchSimulationInput } from "@powerchain/energy-contracts";
import { stableHash } from "../lib/stable-hash.js";
import { config } from "../config.js";
import { decimalToScaledInt, scaledIntToDecimal } from "../lib/decimal.js";

const allowed:Record<DispatchPreparation["state"],readonly DispatchPreparation["state"][]>={
  draft:["simulated","rejected","expired"],
  simulated:["review_required","rejected","expired"],
  review_required:["prepared","rejected","expired"],
  prepared:["expired"],
  rejected:[],
  expired:[],
};

export function assertDispatchTransition(from:DispatchPreparation["state"],to:DispatchPreparation["state"]){
  if(!allowed[from].includes(to)) throw Object.assign(new Error(`DISPATCH_TRANSITION_NOT_ALLOWED:${from}->${to}`),{statusCode:409});
}

export function prepareDispatchSimulation(input:DispatchSimulationInput):DispatchPreparation{
  const scale=9;
  const power=decimalToScaledInt(input.targetPowerMw,scale);
  const energy=(power*BigInt(input.durationMinutes))/60n;
  const expectedEnergyMwh=scaledIntToDecimal(energy,scale);
  const requestHash=stableHash({kind:"ems.dispatch.prepare",...input});
  const draft:DispatchPreparation={id:crypto.randomUUID(),state:"draft",simulation:true,authoritative:false,physicalExecutionEnabled:false,input,expectedEnergyMwh,policyReasons:["HUMAN_REVIEW_REQUIRED","PHYSICAL_EXECUTION_NOT_EXPOSED"],requestHash,expiresAt:new Date(Date.now()+config.SAFE_ACTION_TTL_SECONDS*1000).toISOString()};
  assertDispatchTransition(draft.state,"simulated");
  const simulated={...draft,state:"simulated" as const};
  assertDispatchTransition(simulated.state,"review_required");
  return {...simulated,state:"review_required"};
}
