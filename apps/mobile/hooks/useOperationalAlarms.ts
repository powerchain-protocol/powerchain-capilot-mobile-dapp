import { useCallback } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useOperationalQuery } from '@/hooks/useOperationalQuery';
import { getOperationalAlarms } from '@/services/operations/alarms';

export function useOperationalAlarms(siteId?: string, state: 'open' | 'acknowledged' | 'resolved' = 'open') {
  const { session } = useAuthSession();
  const fetcher = useCallback(async () => {
    if (!session?.accessToken || !siteId) throw new Error('Authentication and siteId are required.');
    return getOperationalAlarms(session.accessToken, siteId, { state, limit: 100 });
  }, [session?.accessToken, siteId, state]);
  const query = useOperationalQuery({ key: `alarms:${session?.userId ?? 'anon'}:${siteId ?? 'none'}:${state}`, enabled: Boolean(session?.accessToken && siteId), fetcher, refreshMs: 20_000, staleMs: 60_000 });
  return { alarms: query.data?.alarms ?? [], page: query.data?.page, error: query.error, isLoading: query.isLoading, isRefreshing: query.isRefreshing, isStale: query.isStale, lastUpdatedAt: query.lastUpdatedAt, refresh: query.refresh };
}
