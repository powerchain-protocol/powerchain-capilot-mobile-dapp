import type { OperationsActor } from "../auth/adapter.js";
import { prisma } from "../db/prisma.js";
import { operationalError } from "../lib/operational-error.js";

export async function requireWalletOwnership(actor:OperationsActor,chain:string,address:string,siteId?:string){
  const wallet=await prisma.walletIdentity.findFirst({where:{organizationId:actor.organizationId,userId:actor.userId,chain,address,revokedAt:null,...(siteId?{OR:[{siteId},{siteId:null}]}:{})}});
  if(!wallet) throw operationalError("WALLET_OWNERSHIP_REQUIRED",403,"The requested wallet is not a verified wallet for this actor.");
  if(!wallet.verifiedAt) throw operationalError("WALLET_NOT_VERIFIED",403,"The requested wallet has not been verified.");
  return wallet;
}
