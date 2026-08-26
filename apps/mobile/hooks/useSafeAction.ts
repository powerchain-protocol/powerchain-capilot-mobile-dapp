import { useCallback, useState } from 'react';

import { useAuthSession } from '@/context/AuthSessionContext';
import { prepareOperationalAction } from '@/actions/safe-actions';
import type { SafeActionDecision, SafeActionType } from '@/types/operations';

export function useSafeAction() {
  const { session } = useAuthSession();
  const [decision, setDecision] = useState<SafeActionDecision>();
  const [error, setError] = useState<string>();
  const [isPreparing, setIsPreparing] = useState(false);

  const prepare = useCallback(async (input: { action: SafeActionType; resourceId: string; reason: string; parameters?: Record<string, unknown> }) => {
    if (!session?.accessToken) {
      setError('Authentication is required.');
      return null;
    }
    setIsPreparing(true);
    setError(undefined);
    try {
      const result = await prepareOperationalAction({ accessToken: session.accessToken, ...input });
      setDecision(result.decision);
      return result.decision;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to prepare operational action.');
      return null;
    } finally { setIsPreparing(false); }
  }, [session?.accessToken]);

  return { decision, error, isPreparing, prepare, reset: () => setDecision(undefined) };
}
