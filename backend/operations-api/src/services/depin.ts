import type { DataMode, DepinNode, Paginated } from '@powerchain/operations-contracts';
import { freshness, operationalStatus } from './freshness.ts';

type DepinRecord = { id: string; siteId: string | null; network: string; status: string; peerId: string | null; endpoint: string | null; lastHeartbeatAt: Date | null; sequence?: string | null; source: string; mode: string; updatedAt: Date };
export interface DepinRepository { listNodes(input: { siteId: string; cursor?: string; take: number }): Promise<DepinRecord[]>; }

export class DepinService {
  constructor(private readonly repository: DepinRepository, private readonly maxAgeSeconds: number, private readonly configuredMode: DataMode) {}
  async listNodes(siteId: string, options: { cursor?: string; limit?: number } = {}): Promise<Paginated<DepinNode>> {
    const limit = options.limit ?? 50;
    const rows = await this.repository.listNodes({ siteId, cursor: options.cursor, take: limit + 1 });
    const hasMore = rows.length > limit;
    const visible = hasMore ? rows.slice(0, limit) : rows;
    const now = new Date();
    const items = visible.map((row) => {
      const mode = row.mode === 'live' || row.mode === 'demo' || row.mode === 'unavailable' ? row.mode : this.configuredMode;
      const observedAt = row.lastHeartbeatAt?.toISOString() ?? null;
      return {
        id: row.id,
        network: row.network,
        siteId: row.siteId,
        status: operationalStatus(row.status),
        peerId: row.peerId,
        endpoint: row.endpoint,
        lastHeartbeatAt: observedAt,
        source: {
          source: row.source,
          mode,
          observedAt,
          receivedAt: row.updatedAt.toISOString(),
          freshness: freshness(row.lastHeartbeatAt, this.maxAgeSeconds, now),
          maxAgeSeconds: this.maxAgeSeconds,
          sequence: row.sequence ?? null,
        },
      } satisfies DepinNode;
    });
    return { items, page: { limit, hasMore, nextCursor: hasMore ? items.at(-1)?.id ?? null : null } };
  }
}
