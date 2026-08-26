import type { DataMode, IotDevice, Paginated } from '@powerchain/operations-contracts';
import { freshness, operationalStatus } from './freshness.ts';

type IotRecord = { id: string; siteId: string; kind: string; label: string; status: string; firmware: string | null; lastSeenAt: Date | null; sequence?: string | null; source: string; mode: string; updatedAt: Date };
export interface IotRepository { listDevices(input: { siteId: string; cursor?: string; take: number }): Promise<IotRecord[]>; }

const allowedKinds = new Set(['meter', 'inverter', 'battery', 'charger', 'sensor', 'gateway', 'other']);

export class IotService {
  constructor(private readonly repository: IotRepository, private readonly maxAgeSeconds: number, private readonly configuredMode: DataMode) {}
  async listDevices(siteId: string, options: { cursor?: string; limit?: number } = {}): Promise<Paginated<IotDevice>> {
    const limit = options.limit ?? 50;
    const rows = await this.repository.listDevices({ siteId, cursor: options.cursor, take: limit + 1 });
    const hasMore = rows.length > limit;
    const visible = hasMore ? rows.slice(0, limit) : rows;
    const now = new Date();
    const items = visible.map((row) => {
      const mode = row.mode === 'live' || row.mode === 'demo' || row.mode === 'unavailable' ? row.mode : this.configuredMode;
      const observedAt = row.lastSeenAt?.toISOString() ?? null;
      return {
        id: row.id,
        siteId: row.siteId,
        kind: (allowedKinds.has(row.kind) ? row.kind : 'other') as IotDevice['kind'],
        label: row.label,
        status: operationalStatus(row.status),
        lastSeenAt: observedAt,
        firmware: row.firmware,
        source: {
          source: row.source,
          mode,
          observedAt,
          receivedAt: row.updatedAt.toISOString(),
          freshness: freshness(row.lastSeenAt, this.maxAgeSeconds, now),
          maxAgeSeconds: this.maxAgeSeconds,
          sequence: row.sequence ?? null,
        },
      } satisfies IotDevice;
    });
    return { items, page: { limit, hasMore, nextCursor: hasMore ? items.at(-1)?.id ?? null : null } };
  }
}
