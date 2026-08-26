import type { EnergySiteSummary } from '@powerchain/operations-contracts';
import type { OperationsPrismaClient } from '../db/prisma.ts';

export class SiteService {
  constructor(private readonly prisma: OperationsPrismaClient) {}

  async listForUser(userId: string): Promise<EnergySiteSummary[]> {
    const rows = await this.prisma.siteAccess.findMany({
      where: { userId },
      include: { site: { select: { id: true, organizationId: true, name: true, timezone: true } } },
      orderBy: [{ role: 'asc' }, { siteId: 'asc' }],
    });
    return rows.map((row) => ({
      id: row.site.id,
      organizationId: row.site.organizationId,
      name: row.site.name,
      timezone: row.site.timezone,
      role: row.role,
    }));
  }
}
