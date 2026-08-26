import { useCallback, useMemo } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useOperationalQuery } from '@/hooks/useOperationalQuery';
import { getMarketPrices } from '@/services/operations/market-data';

export function useMarketPrices(symbols: string[]) {
  const { session } = useAuthSession();
  const key = useMemo(() => [...new Set(symbols.map((value) => value.trim().toUpperCase()).filter(Boolean))].sort().join(','), [symbols]);
  const fetcher = useCallback(async () => {
    if (!session?.accessToken || !key) throw new Error('Authentication and symbols are required.');
    return getMarketPrices(session.accessToken, key.split(','));
  }, [key, session?.accessToken]);
  const query = useOperationalQuery({ key: `market:${session?.userId ?? 'anon'}:${key}`, enabled: Boolean(session?.accessToken && key), fetcher, refreshMs: 30_000, staleMs: 90_000 });
  return { prices: query.data?.prices ?? [], error: query.error, isLoading: query.isLoading, isRefreshing: query.isRefreshing, isStale: query.isStale, lastUpdatedAt: query.lastUpdatedAt, refresh: query.refresh };
}
