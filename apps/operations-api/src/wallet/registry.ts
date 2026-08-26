import { prisma } from "../db/prisma.js";

export type OperationsWalletChain = "solana" | "sui";

function validateAddress(chain: OperationsWalletChain, address: string) {
  if (chain === "sui") return /^0x[0-9a-fA-F]{64}$/.test(address);
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export async function listWalletIdentities(organizationId: string, userId: string) {
  return prisma.walletIdentity.findMany({
    where: { organizationId, userId, revokedAt: null },
    select: { id: true, chain: true, address: true, label: true, isPrimary: true, verifiedAt: true, createdAt: true },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

export async function registerPublicWallet(input: { organizationId: string; userId: string; chain: OperationsWalletChain; address: string; label?: string }) {
  if (!validateAddress(input.chain, input.address)) throw Object.assign(new Error("WALLET_ADDRESS_INVALID"), { statusCode: 400 });
  return prisma.walletIdentity.upsert({
    where: { organizationId_chain_address: { organizationId: input.organizationId, chain: input.chain, address: input.address } },
    update: { userId: input.userId, label: input.label, revokedAt: null },
    create: { organizationId: input.organizationId, userId: input.userId, chain: input.chain, address: input.address, label: input.label },
  });
}
