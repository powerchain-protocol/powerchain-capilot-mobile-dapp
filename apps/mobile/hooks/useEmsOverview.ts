import { useCallback } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useOperationalQuery } from '@/hooks/useOperationalQuery';
import { getEmsOverview } from '@/services/operations/ems';

export function useEmsOverview(siteId?: string) {
  const { session } = useAuthSession();
  const fetcher = useCallback(async () => {
    if (!session?.accessToken || !siteId) throw new Error('Authentication and siteId are required.');
    return (await getEmsOverview(session.accessToken, siteId)).overview;
  }, [session?.accessToken, siteId]);
  const query = useOperationalQuery({ key: `ems:${session?.userId ?? 'anon'}:${siteId ?? 'none'}`, enabled: Boolean(session?.accessToken && siteId), fetcher, refreshMs: 15_000, staleMs: 45_000 });
  return { overview: query.data, error: query.error, isLoading: query.isLoading, isRefreshing: query.isRefreshing, isStale: query.isStale, lastUpdatedAt: query.lastUpdatedAt, refresh: query.refresh };
}
