import type { AiProviderId } from "../../integrations/ai-providers.js";
export interface LlmRouteDecision { provider:AiProviderId; configured:boolean; reason:string; }
export interface LlmRuntimePolicy { managed:boolean; providerOrder:AiProviderId[]; fallbackDoesNotRebill:true; toolCalling:"structured"; }
