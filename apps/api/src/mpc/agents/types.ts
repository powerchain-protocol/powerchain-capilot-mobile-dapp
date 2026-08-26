export type AgentCapability = "observe" | "analyze" | "prepare_action" | "request_evidence";
export interface AgentDefinition { id:string; slug:string; name:string; capabilities:AgentCapability[]; canApprove:false; canSign:false; canDispatchPhysical:false; }
