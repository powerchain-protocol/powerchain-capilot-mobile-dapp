import type { FastifyInstance } from "fastify";
import { authenticate } from "../lib/session.js";
import { llmRoutePlan, llmRuntimePolicy } from "../ai/llm/index.js";
export async function registerLlmRoutes(app:FastifyInstance){app.get("/api/v1/llm/providers",async(request)=>{await authenticate(request);return{policy:llmRuntimePolicy(),providers:llmRoutePlan()};});}
