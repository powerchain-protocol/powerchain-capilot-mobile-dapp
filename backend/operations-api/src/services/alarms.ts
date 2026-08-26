import type { DataMode, OperationalAlarm, Paginated } from '@powerchain/operations-contracts';
import { freshness } from './freshness.ts';

type AlarmRecord = {
  id: string; siteId: string; resourceId: string | null; code: string; title: string; detail: string | null;
  severity: string; state: string; source: string; mode: string; observedAt: Date; openedAt: Date;
  acknowledgedAt: Date | null; resolvedAt: Date | null; updatedAt: Date;
};
export interface AlarmRepository { listAlarms(input: { siteId: string; state?: string; cursor?: string; take: number }): Promise<AlarmRecord[]>; }

export class AlarmService {
  constructor(private readonly repository: AlarmRepository, private readonly maxAgeSeconds: number, private readonly configuredMode: DataMode) {}
  async list(siteId: string, options: { state?: string; cursor?: string; limit?: number } = {}): Promise<Paginated<OperationalAlarm>> {
    const limit = options.limit ?? 50;
    const rows = await this.repository.listAlarms({ siteId, state: options.state, cursor: options.cursor, take: limit + 1 });
    const hasMore = rows.length > limit;
    const visible = hasMore ? rows.slice(0, limit) : rows;
    const items = visible.map((row) => {
      const mode = row.mode === 'live' || row.mode === 'demo' || row.mode === 'unavailable' ? row.mode : this.configuredMode;
      return {
        id: row.id,
        siteId: row.siteId,
        resourceId: row.resourceId,
        code: row.code,
        title: row.title,
        detail: row.detail,
        severity: (['info', 'warning', 'critical'].includes(row.severity) ? row.severity : 'warning') as OperationalAlarm['severity'],
        state: (['open', 'acknowledged', 'resolved'].includes(row.state) ? row.state : 'open') as OperationalAlarm['state'],
        openedAt: row.openedAt.toISOString(),
        acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
        resolvedAt: row.resolvedAt?.toISOString() ?? null,
        source: {
          source: row.source,
          mode,
          observedAt: row.observedAt.toISOString(),
          receivedAt: row.updatedAt.toISOString(),
          freshness: freshness(row.observedAt, this.maxAgeSeconds),
          maxAgeSeconds: this.maxAgeSeconds,
        },
      } satisfies OperationalAlarm;
    });
    return { items, page: { limit, hasMore, nextCursor: hasMore ? items.at(-1)?.id ?? null : null } };
  }
}
