import { createHash } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { encryptSetting, decryptSetting } from "../../lib/settings-crypto.js";
import { env } from "../../config/env.js";
import type { MemoryKind, MemoryRecord } from "./types.js";

export async function upsertMemory(input:{userId:string;slug:string;kind:MemoryKind;content:string;metadata?:Record<string,unknown>;expiresAt?:Date|null}) {
  if (!env.AI_MEMORY_ENABLED) throw Object.assign(new Error("AI memory is disabled."), { code:"AI_MEMORY_DISABLED", statusCode:403 });
  const encryptedContent=encryptSetting(input.content);
  const contentHash=createHash("sha256").update(input.content).digest("hex");
  return prisma.aiMemory.upsert({ where:{userId_slug:{userId:input.userId,slug:input.slug}}, create:{...input,encryptedContent,contentHash,metadata:input.metadata as object|undefined}, update:{kind:input.kind,encryptedContent,contentHash,metadata:input.metadata as object|undefined,expiresAt:input.expiresAt} });
}
export async function listMemory(userId:string):Promise<MemoryRecord[]> {
  if (!env.AI_MEMORY_ENABLED) return [];
  const rows=await prisma.aiMemory.findMany({where:{userId,OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},orderBy:{updatedAt:"desc"},take:env.AI_MEMORY_MAX_ITEMS});
  return rows.map((row)=>({id:row.id,slug:row.slug,kind:row.kind,content:decryptSetting(row.encryptedContent),metadata:(row.metadata??undefined) as Record<string,unknown>|undefined,updatedAt:row.updatedAt.toISOString(),expiresAt:row.expiresAt?.toISOString()??null}));
}
export async function deleteMemory(userId:string,slug:string){ return prisma.aiMemory.deleteMany({where:{userId,slug}}); }
