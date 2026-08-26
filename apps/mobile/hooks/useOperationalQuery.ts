import { AppState } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { operationalCache } from '@/services/operations/cache';

export function useOperationalQuery<T>(input: {
  key: string;
  enabled: boolean;
  fetcher: () => Promise<T>;
  refreshMs?: number;
  staleMs?: number;
}) {
  const cached = useMemo(() => input.enabled ? operationalCache.get<T>(input.key) : undefined, [input.enabled, input.key]);
  const [data, setData] = useState<T | undefined>(cached?.value);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | undefined>(cached?.updatedAt);
  const [error, setError] = useState<string>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const fetcherRef = useRef(input.fetcher);
  fetcherRef.current = input.fetcher;

  useEffect(() => {
    if (!input.enabled) {
      setData(undefined);
      setLastUpdatedAt(undefined);
      setError(undefined);
      return;
    }
    const entry = operationalCache.get<T>(input.key);
    setData(entry?.value);
    setLastUpdatedAt(entry?.updatedAt);
  }, [input.enabled, input.key]);

  const refresh = useCallback(async () => {
    if (!input.enabled) return false;
    if (inFlight.current) return inFlight.current;
    const run = (async () => {
      setIsRefreshing(true);
      setError(undefined);
      try {
        const next = await fetcherRef.current();
        const entry = operationalCache.set(input.key, next);
        setData(next);
        setLastUpdatedAt(entry.updatedAt);
        return true;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to refresh operational data.');
        return false;
      } finally {
        setIsRefreshing(false);
        inFlight.current = null;
      }
    })();
    inFlight.current = run;
    return run;
  }, [input.enabled, input.key]);

  useEffect(() => {
    if (!input.enabled) return;
    void refresh();
    const refreshMs = input.refreshMs ?? 30_000;
    const timer = refreshMs > 0 ? setInterval(() => { void refresh(); }, refreshMs) : undefined;
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void refresh(); });
    return () => { if (timer) clearInterval(timer); subscription.remove(); };
  }, [input.enabled, input.refreshMs, refresh]);

  const staleMs = input.staleMs ?? Math.max((input.refreshMs ?? 30_000) * 2, 60_000);
  const isStale = !lastUpdatedAt || Date.now() - lastUpdatedAt > staleMs;
  const isLoading = input.enabled && data === undefined && isRefreshing;

  return { data, error, isLoading, isRefreshing, isStale, lastUpdatedAt, refresh };
}
