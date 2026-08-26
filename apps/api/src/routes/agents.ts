import type { FastifyInstance } from "fastify";
import { authenticate } from "../lib/session.js";
import { POWERCHAIN_AGENTS } from "../mpc/agents/index.js";
export async function registerAgentRoutes(app:FastifyInstance){app.get("/api/v1/mpc/agents",async(request)=>{await authenticate(request);return{items:POWERCHAIN_AGENTS,authority:{agentsCanApprove:false,agentsCanSign:false,agentsCanDispatchPhysical:false}};});}
