import { useCallback } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useOperationalQuery } from '@/hooks/useOperationalQuery';
import { getOperationalSites } from '@/services/operations/sites';

export function useOperationalSites() {
  const { session } = useAuthSession();
  const fetcher = useCallback(async () => {
    if (!session?.accessToken) throw new Error('Authentication is required.');
    return getOperationalSites(session.accessToken);
  }, [session?.accessToken]);
  const query = useOperationalQuery({ key: `sites:${session?.userId ?? 'anon'}`, enabled: Boolean(session?.accessToken), fetcher, refreshMs: 60_000, staleMs: 5 * 60_000 });
  return { sites: query.data?.sites ?? [], error: query.error, isLoading: query.isLoading, isRefreshing: query.isRefreshing, isStale: query.isStale, refresh: query.refresh };
}
