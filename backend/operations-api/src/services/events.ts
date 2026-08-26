import type { DataMode, OperationalEvent, Paginated } from '@powerchain/operations-contracts';
import { freshness } from './freshness.ts';

type EventRecord = {
  id: string; siteId: string | null; resourceId: string | null; kind: string; type: string; summary: string;
  actorType: string; actorId: string | null; source: string; mode: string; metadata: unknown; occurredAt: Date; receivedAt: Date;
};
export interface EventRepository { listEvents(input: { siteId: string; kind?: string; cursor?: string; take: number }): Promise<EventRecord[]>; }

export class EventService {
  constructor(private readonly repository: EventRepository, private readonly maxAgeSeconds: number, private readonly configuredMode: DataMode) {}
  async list(siteId: string, options: { kind?: string; cursor?: string; limit?: number } = {}): Promise<Paginated<OperationalEvent>> {
    const limit = options.limit ?? 50;
    const rows = await this.repository.listEvents({ siteId, kind: options.kind, cursor: options.cursor, take: limit + 1 });
    const hasMore = rows.length > limit;
    const visible = hasMore ? rows.slice(0, limit) : rows;
    const items = visible.map((row) => {
      const mode = row.mode === 'live' || row.mode === 'demo' || row.mode === 'unavailable' ? row.mode : this.configuredMode;
      const metadata = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? Object.fromEntries(Object.entries(row.metadata as Record<string, unknown>).filter((entry): entry is [string, string | number | boolean | null] => entry[1] === null || ['string', 'number', 'boolean'].includes(typeof entry[1])))
        : undefined;
      return {
        id: row.id,
        siteId: row.siteId,
        resourceId: row.resourceId,
        kind: (['telemetry', 'device', 'depin', 'alarm', 'action', 'provider', 'system'].includes(row.kind) ? row.kind : 'system') as OperationalEvent['kind'],
        type: row.type,
        summary: row.summary,
        actorType: (['system', 'provider', 'user'].includes(row.actorType) ? row.actorType : 'system') as OperationalEvent['actorType'],
        actorId: row.actorId,
        occurredAt: row.occurredAt.toISOString(),
        source: {
          source: row.source,
          mode,
          observedAt: row.occurredAt.toISOString(),
          receivedAt: row.receivedAt.toISOString(),
          freshness: freshness(row.occurredAt, this.maxAgeSeconds),
          maxAgeSeconds: this.maxAgeSeconds,
        },
        metadata,
      } satisfies OperationalEvent;
    });
    return { items, page: { limit, hasMore, nextCursor: hasMore ? items.at(-1)?.id ?? null : null } };
  }
}
