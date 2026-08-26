import { aiProviderStatus } from "../../integrations/ai-providers.js";
import { env } from "../../config/env.js";
import type { AiProviderId } from "../../integrations/ai-providers.js";
import type { LlmRouteDecision, LlmRuntimePolicy } from "./types.js";
export function llmRuntimePolicy():LlmRuntimePolicy { return { managed:env.AI_MODE==="managed", providerOrder:[env.AI_PRIMARY_PROVIDER,...env.AI_PROVIDER_ORDER_PARSED].filter((v,i,a)=>a.indexOf(v)===i) as AiProviderId[], fallbackDoesNotRebill:true, toolCalling:"structured" }; }
export function llmRoutePlan():LlmRouteDecision[] { const status=new Map(aiProviderStatus().map((x)=>[x.id,x])); return llmRuntimePolicy().providerOrder.map((provider)=>({provider,configured:Boolean(status.get(provider)?.configured),reason:status.get(provider)?.configured?"eligible":"not_configured"})); }
