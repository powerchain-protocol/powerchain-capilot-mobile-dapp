import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../lib/session.js";
import { deleteMemory, listMemory, upsertMemory } from "../ai/memory/index.js";

const bodySchema=z.object({kind:z.enum(["preference","site_context","workflow","decision_note"]),content:z.string().min(1).max(8000),metadata:z.record(z.string(),z.unknown()).optional(),expiresAt:z.string().datetime().nullable().optional()});
export async function registerMemoryRoutes(app:FastifyInstance){
 app.get("/api/v1/ai/memory",async(request)=>{const{user}=await authenticate(request);return{items:await listMemory(user.id)};});
 app.put("/api/v1/ai/memory/:slug",async(request)=>{const{user}=await authenticate(request);const{slug}=z.object({slug:z.string().regex(/^[a-z0-9][a-z0-9._-]{1,79}$/)}).parse(request.params);const body=bodySchema.parse(request.body);const row=await upsertMemory({userId:user.id,slug,kind:body.kind,content:body.content,metadata:body.metadata,expiresAt:body.expiresAt?new Date(body.expiresAt):body.expiresAt});return{id:row.id,slug:row.slug,kind:row.kind,updatedAt:row.updatedAt.toISOString()};});
 app.delete("/api/v1/ai/memory/:slug",async(request,reply)=>{const{user}=await authenticate(request);const{slug}=z.object({slug:z.string().min(1)}).parse(request.params);await deleteMemory(user.id,slug);return reply.code(204).send();});
}
