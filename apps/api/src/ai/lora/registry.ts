import { env } from "../../config/env.js";
export interface LoraRuntimeDescriptor { enabled:boolean; configured:boolean; model:string|null; endpointClass:"server_only"; trainingInApi:false; }
export function loraRuntimeDescriptor():LoraRuntimeDescriptor { return { enabled:env.LORA_ENABLED, configured:Boolean(env.LORA_ENABLED&&env.LORA_BASE_URL&&env.LORA_MODEL), model:env.LORA_MODEL??null, endpointClass:"server_only", trainingInApi:false }; }
