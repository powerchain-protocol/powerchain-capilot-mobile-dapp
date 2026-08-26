import { useCallback } from 'react';
import { useOperationalQuery } from '@/hooks/useOperationalQuery';
import { getApiHealth, getPublicRuntimeConfig } from '@/services/operations/client';

export function useOperationalHealth() {
  const fetcher = useCallback(async () => {
    const [health, config] = await Promise.all([getApiHealth(), getPublicRuntimeConfig()]);
    return { health, config };
  }, []);
  const query = useOperationalQuery({ key: 'operations:public-health-config', enabled: true, fetcher, refreshMs: 30_000, staleMs: 90_000 });
  return { health: query.data?.health, config: query.data?.config, error: query.error, isLoading: query.isLoading, isRefreshing: query.isRefreshing, isStale: query.isStale, lastUpdatedAt: query.lastUpdatedAt, refresh: query.refresh };
}
