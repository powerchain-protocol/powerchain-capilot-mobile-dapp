import type { EvidenceEnvelope, JsonEvidenceExport, DigitalTwinExport } from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";
import { stableHash } from "../lib/stable-hash.js";
import { buildSiteDigitalTwin, snapshotSiteDigitalTwin } from "./digital-twin.js";

export function evidenceView(row:any):EvidenceEnvelope{
  return {schemaVersion:"1.0.0",id:row.id,organizationId:row.organizationId,siteId:row.siteId,kind:row.kind,classification:row.classification,source:row.source,truthTier:row.truthTier,validationState:row.validationState,contentHash:row.contentHash,observedAt:row.observedAt.toISOString(),receivedAt:row.receivedAt.toISOString(),payload:row.payload as Record<string,unknown>,authoritative:row.authoritative,label:row.label};
}

export async function recordEvidence(input:Omit<EvidenceEnvelope,"schemaVersion"|"id"|"contentHash">){
  const contentHash=stableHash({source:input.source,observedAt:input.observedAt,payload:input.payload,truthTier:input.truthTier});
  return prisma.evidenceEnvelopeRecord.create({data:{...input,contentHash,observedAt:new Date(input.observedAt),receivedAt:new Date(input.receivedAt)}});
}

export async function exportSiteEvidence(organizationId:string,siteId:string):Promise<JsonEvidenceExport>{
  const rows=await prisma.evidenceEnvelopeRecord.findMany({where:{organizationId,siteId},orderBy:{createdAt:"asc"},take:1000});
  return {exportVersion:"1.0.0",exportedAt:new Date().toISOString(),organizationId,siteId,evidence:rows.map(evidenceView)};
}

export async function exportTwinSnapshot(organizationId:string,siteId:string):Promise<DigitalTwinExport>{
  const {twin,snapshotHash}=await snapshotSiteDigitalTwin(organizationId,siteId);
  return {exportVersion:"1.0.0",exportedAt:new Date().toISOString(),twin,snapshotHash};
}

export async function ensureTwinEvidence(organizationId:string,siteId:string){
  const twin=await buildSiteDigitalTwin(organizationId,siteId);
  const observedAt=twin.asOf, receivedAt=new Date().toISOString();
  return recordEvidence({organizationId,siteId,kind:"site.digital_twin",classification:"internal",source:"powerchain.operations",truthTier:"T4",validationState:"first_party_verified",observedAt,receivedAt,payload:twin,authoritative:twin.authoritative,label:twin.authoritative?"live":"simulation"});
}
