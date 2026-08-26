import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '@/context/AuthSessionContext';
import { ApiError } from '@/lib/http';
import {
  claimDemoCreditGrant,
  createSolanaPayTopUp,
  getCreditAccount,
  getCreditLedger,
  getCreditPricing,
  getSolanaPayTopUp,
} from '@/services/credits';
import type { CreditAccount, CreditLedgerEntry, CreditPricing, SolanaPayTopUp } from '@/types/credits';

const TOP_UP_POLL_MS = 4_000;

function topUpIdempotencyKey() {
  return `pwrc-topup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function useCredits() {
  const { session } = useAuthSession();
  const [pricing, setPricing] = useState<CreditPricing>();
  const [account, setAccount] = useState<CreditAccount>();
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTopUpPolling, setIsTopUpPolling] = useState(false);
  const [error, setError] = useState<string>();
  const [lastTopUp, setLastTopUp] = useState<SolanaPayTopUp>();
  const pollInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!session?.accessToken) {
      setPricing(undefined);
      setAccount(undefined);
      setLedger([]);
      return false;
    }
    setIsLoading(true);
    setError(undefined);
    try {
      const [nextPricing, nextAccount, nextLedger] = await Promise.all([
        getCreditPricing(session.accessToken),
        getCreditAccount(session.accessToken),
        getCreditLedger(session.accessToken),
      ]);
      setPricing(nextPricing);
      setAccount(nextAccount);
      setLedger(nextLedger.entries);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load PWRC credits.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!session?.accessToken || !lastTopUp || lastTopUp.status !== 'pending') {
      setIsTopUpPolling(false);
      return;
    }

    let cancelled = false;
    setIsTopUpPolling(true);
    const poll = async () => {
      if (cancelled || pollInFlight.current || !session.accessToken) return;
      pollInFlight.current = true;
      try {
        const topUp = await getSolanaPayTopUp(session.accessToken, lastTopUp.id);
        if (cancelled) return;
        setLastTopUp(topUp);
        if (topUp.status === 'settled') {
          setError(undefined);
          await refresh();
        } else if (topUp.status === 'expired') {
          setError('This PWRC Solana Pay request expired without a verified settlement. Create a new top-up request.');
        }
      } catch (caught) {
        if (!cancelled && !(caught instanceof ApiError && caught.status >= 500)) {
          setError(caught instanceof Error ? caught.message : 'Unable to verify the PWRC top-up status.');
        }
      } finally {
        pollInFlight.current = false;
      }
    };

    void poll();
    const timer = setInterval(() => void poll(), TOP_UP_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [lastTopUp?.id, lastTopUp?.status, refresh, session?.accessToken]);

  const claimDemoGrant = useCallback(async () => {
    if (!session?.accessToken) return false;
    setIsLoading(true);
    setError(undefined);
    try {
      setAccount(await claimDemoCreditGrant(session.accessToken));
      await refresh();
      return true;
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'DEMO_GRANT_ALREADY_CLAIMED') {
        setError('The one-time sample PWRC grant has already been claimed for this account.');
      } else {
        setError(caught instanceof Error ? caught.message : 'Unable to claim sample PWRC credits.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refresh, session?.accessToken]);

  const createTopUp = useCallback(
    async (amountBaseUnits: string) => {
      if (!session?.accessToken) return null;
      setIsLoading(true);
      setError(undefined);
      try {
        const topUp = await createSolanaPayTopUp(session.accessToken, amountBaseUnits, topUpIdempotencyKey());
        setLastTopUp(topUp);
        return topUp;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to create a PWRC Solana Pay top-up.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [session?.accessToken],
  );

  return {
    authenticated: Boolean(session?.accessToken),
    pricing,
    account,
    ledger,
    isLoading,
    isTopUpPolling,
    error,
    lastTopUp,
    refresh,
    claimDemoGrant,
    createTopUp,
  };
}
