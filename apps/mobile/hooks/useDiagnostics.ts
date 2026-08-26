import { useCallback } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useOperationalQuery } from '@/hooks/useOperationalQuery';
import { getDiagnostics } from '@/services/diagnostics';

export function useDiagnostics() {
  const { session } = useAuthSession();
  const fetcher = useCallback(async () => {
    if (!session?.accessToken) throw new Error('Authentication required.');
    return getDiagnostics(session.accessToken);
  }, [session?.accessToken]);
  const query = useOperationalQuery({
    key: `diagnostics:${session?.userId ?? 'anon'}`,
    enabled: Boolean(session?.accessToken),
    fetcher,
    refreshMs: 30_000,
    staleMs: 60_000,
  });
  return { ...query, diagnostics: query.data };
}
