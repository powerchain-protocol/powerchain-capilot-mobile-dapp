import type { SafeActionState, SafeActionType } from "@powerchain/energy-contracts";
export interface SafeActionPolicyDecision { state: SafeActionState; reasons: string[]; confirmationRequired: boolean; walletSignatureRequired: boolean; readOnly: boolean; }
const POLICIES: Record<SafeActionType,SafeActionPolicyDecision> = {
  "ems.dispatch.prepare": { state:"prepared", reasons:["HUMAN_REVIEW_REQUIRED","SIMULATION_REQUIRED","PHYSICAL_EXECUTION_NOT_EXPOSED"], confirmationRequired:true, walletSignatureRequired:false, readOnly:false },
  "iot.device.refresh": { state:"read_only", reasons:["READ_ONLY_REFRESH"], confirmationRequired:false, walletSignatureRequired:false, readOnly:true },
  "depin.node.refresh": { state:"read_only", reasons:["READ_ONLY_REFRESH"], confirmationRequired:false, walletSignatureRequired:false, readOnly:true },
  "alarm.acknowledge.prepare": { state:"prepared", reasons:["HUMAN_CONFIRMATION_REQUIRED","ALARM_STATE_CHANGE_NOT_EXECUTED"], confirmationRequired:true, walletSignatureRequired:false, readOnly:false },
  "wallet.signature.prepare": { state:"prepared", reasons:["USER_WALLET_SIGNATURE_REQUIRED","SERVER_SIGNING_PROHIBITED"], confirmationRequired:true, walletSignatureRequired:true, readOnly:false },
  "settlement.prepare": { state:"prepared", reasons:["USER_WALLET_SIGNATURE_REQUIRED","SETTLEMENT_EXECUTION_NOT_EXPOSED"], confirmationRequired:true, walletSignatureRequired:true, readOnly:false },
};
export function evaluateSafeActionPolicy(type:SafeActionType):SafeActionPolicyDecision { return { ...POLICIES[type], reasons:[...POLICIES[type].reasons] }; }
