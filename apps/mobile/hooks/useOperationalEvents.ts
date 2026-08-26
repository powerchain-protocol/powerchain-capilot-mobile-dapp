import { useCallback } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useOperationalQuery } from '@/hooks/useOperationalQuery';
import { getOperationalEvents } from '@/services/operations/events';
import type { OperationalEventKind } from '@/types/operations';

export function useOperationalEvents(siteId?: string, kind?: OperationalEventKind) {
  const { session } = useAuthSession();
  const fetcher = useCallback(async () => {
    if (!session?.accessToken || !siteId) throw new Error('Authentication and siteId are required.');
    return getOperationalEvents(session.accessToken, siteId, { kind, limit: 100 });
  }, [session?.accessToken, siteId, kind]);
  const query = useOperationalQuery({ key: `events:${session?.userId ?? 'anon'}:${siteId ?? 'none'}:${kind ?? 'all'}`, enabled: Boolean(session?.accessToken && siteId), fetcher, refreshMs: 30_000, staleMs: 90_000 });
  return { events: query.data?.events ?? [], page: query.data?.page, error: query.error, isLoading: query.isLoading, isRefreshing: query.isRefreshing, isStale: query.isStale, lastUpdatedAt: query.lastUpdatedAt, refresh: query.refresh };
}
