import type { OperationalSiteSummary } from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";
export async function listAccessibleSites(organizationId:string,userId:string):Promise<OperationalSiteSummary[]> {
 const rows=await prisma.siteAccess.findMany({where:{organizationId,userId,revokedAt:null,OR:[{expiresAt:null},{expiresAt:{gt:new Date()}}]},include:{site:true},orderBy:{site:{name:"asc"}}});
 return rows.map((row)=>({id:row.site.id,name:row.site.name,country:row.site.country??undefined,timezone:row.site.timezone??undefined,role:row.role as OperationalSiteSummary["role"],permissions:Array.isArray(row.permissions)?row.permissions.map(String):[]}));
}
