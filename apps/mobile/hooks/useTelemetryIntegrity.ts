import { useCallback } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useOperationalQuery } from '@/hooks/useOperationalQuery';
import { getTelemetryIntegrity } from '@/services/operations/integrity';

export function useTelemetryIntegrity(siteId?: string) {
  const { session } = useAuthSession();
  const fetcher = useCallback(async () => {
    if (!session?.accessToken || !siteId) throw new Error('Authentication and siteId are required.');
    return getTelemetryIntegrity(session.accessToken, siteId);
  }, [session?.accessToken, siteId]);
  const query = useOperationalQuery({
    key: `telemetry-integrity:${session?.userId ?? 'anon'}:${siteId ?? 'none'}`,
    enabled: Boolean(session?.accessToken && siteId),
    fetcher,
    refreshMs: 20_000,
    staleMs: 60_000,
  });
  return { integrity: query.data?.integrity, error: query.error, isLoading: query.isLoading, isRefreshing: query.isRefreshing, isStale: query.isStale, lastUpdatedAt: query.lastUpdatedAt, refresh: query.refresh };
}
