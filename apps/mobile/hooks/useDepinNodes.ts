import { useCallback } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useOperationalQuery } from '@/hooks/useOperationalQuery';
import { getDepinNodes } from '@/services/operations/depin';

export function useDepinNodes(siteId?: string) {
  const { session } = useAuthSession();
  const fetcher = useCallback(async () => {
    if (!session?.accessToken || !siteId) throw new Error('Authentication and siteId are required.');
    return getDepinNodes(session.accessToken, siteId, { limit: 100 });
  }, [session?.accessToken, siteId]);
  const query = useOperationalQuery({ key: `depin:${session?.userId ?? 'anon'}:${siteId ?? 'none'}`, enabled: Boolean(session?.accessToken && siteId), fetcher, refreshMs: 30_000, staleMs: 90_000 });
  return { nodes: query.data?.nodes ?? [], page: query.data?.page, error: query.error, isLoading: query.isLoading, isRefreshing: query.isRefreshing, isStale: query.isStale, lastUpdatedAt: query.lastUpdatedAt, refresh: query.refresh };
}
