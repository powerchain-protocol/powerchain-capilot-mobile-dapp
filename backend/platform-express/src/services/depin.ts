import type { DepinNetworkSummary, DepinNode } from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";

export async function listDepinNodes(organizationId: string): Promise<DepinNode[]> {
  const rows = await prisma.depinNode.findMany({
    where: { organizationId },
    orderBy: [{ network: "asc" }, { updatedAt: "desc" }],
    take: 500,
  });
  return rows.map((row) => ({
    id: row.id,
    network: row.network,
    operatorId: row.operatorId ?? undefined,
    siteId: row.siteId ?? undefined,
    region: row.region ?? undefined,
    nodeType: row.nodeType as DepinNode["nodeType"],
    status: row.status.toLowerCase() as DepinNode["status"],
    identityReference: row.identityReference ?? undefined,
    lastHeartbeatAt: row.lastHeartbeatAt?.toISOString(),
    rewards:
      row.rewardAsset && row.rewardAmountBaseUnits != null && row.rewardDecimals != null
        ? {
            asset: row.rewardAsset,
            amountBaseUnits: String(row.rewardAmountBaseUnits),
            decimals: row.rewardDecimals,
          }
        : undefined,
  }));
}

export async function summarizeDepin(organizationId: string): Promise<DepinNetworkSummary[]> {
  const rows = await listDepinNodes(organizationId);
  const map = new Map<string, DepinNetworkSummary>();
  for (const row of rows) {
    const current = map.get(row.network) ?? {
      network: row.network,
      activeNodes: 0,
      degradedNodes: 0,
      inactiveNodes: 0,
    };
    if (row.status === "active") current.activeNodes += 1;
    else if (row.status === "degraded") current.degradedNodes += 1;
    else current.inactiveNodes += 1;
    map.set(row.network, current);
  }
  return [...map.values()];
}
