import type { DepinNetworkSummary, DepinNode } from "@powerchain/energy-contracts";
import { assertResourceSite } from "../auth/site-access.js";
import { prisma } from "../db/prisma.js";

export async function listDepinNodes(organizationId: string, siteId: string): Promise<DepinNode[]> {
  await assertResourceSite(organizationId, siteId);
  const rows = await prisma.depinNode.findMany({ where: { organizationId, siteId }, orderBy: [{ status: "asc" }, { network: "asc" }], take: 1000 });
  return rows.map((row) => ({ id: row.id, network: row.network, operatorId: row.operatorId ?? undefined, siteId: row.siteId ?? undefined,
    region: row.region ?? undefined, nodeType: row.nodeType as DepinNode["nodeType"], status: row.status.toLowerCase() as DepinNode["status"],
    identityReference: row.identityReference ?? undefined, lastHeartbeatAt: row.lastHeartbeatAt?.toISOString(),
    rewards: row.rewardAsset && row.rewardAmountBaseUnits != null && row.rewardDecimals != null ? { asset: row.rewardAsset, amountBaseUnits: String(row.rewardAmountBaseUnits), decimals: row.rewardDecimals } : undefined }));
}

export async function summarizeDepin(organizationId: string, siteId: string): Promise<DepinNetworkSummary[]> {
  const rows = await listDepinNodes(organizationId, siteId); const map = new Map<string,DepinNetworkSummary>();
  for (const row of rows) { const v = map.get(row.network) ?? { network: row.network, activeNodes: 0, degradedNodes: 0, inactiveNodes: 0 };
    if (row.status === "active") v.activeNodes++; else if (row.status === "degraded") v.degradedNodes++; else v.inactiveNodes++; map.set(row.network,v); }
  return [...map.values()];
}
