import { useCallback } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useOperationalQuery } from '@/hooks/useOperationalQuery';
import { getOperationalTwin } from '@/services/operations/twin';

export function useOperationalTwin(siteId?: string) {
  const { session } = useAuthSession();
  const fetcher = useCallback(async () => {
    if (!session?.accessToken || !siteId) throw new Error('Authentication and siteId are required.');
    return (await getOperationalTwin(session.accessToken, siteId)).twin;
  }, [session?.accessToken, siteId]);
  const query = useOperationalQuery({ key: `twin:${session?.userId ?? 'anon'}:${siteId ?? 'none'}`, enabled: Boolean(session?.accessToken && siteId), fetcher, refreshMs: 20_000, staleMs: 60_000 });
  return { twin: query.data, error: query.error, isLoading: query.isLoading, isRefreshing: query.isRefreshing, isStale: query.isStale, lastUpdatedAt: query.lastUpdatedAt, refresh: query.refresh };
}
