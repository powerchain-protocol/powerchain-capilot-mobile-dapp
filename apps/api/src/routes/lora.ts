import type { FastifyInstance } from "fastify";
import { authenticate } from "../lib/session.js";
import { loraRuntimeDescriptor } from "../ai/lora/index.js";
export async function registerLoraRoutes(app:FastifyInstance){app.get("/api/v1/lora",async(request)=>{await authenticate(request);return loraRuntimeDescriptor();});}
