import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  getPwrcCreditAccount,
  getPwrcMessageQuote,
  getPwrcPricing,
} from "./api";
import { useAccount } from "../account";
import type {
  PwrcCreditAccount,
  PwrcMessageQuote,
  PwrcPricing,
} from "./types";

type Value = {
  account: PwrcCreditAccount | null;
  pricing: PwrcPricing | null;
  quote: PwrcMessageQuote | null;
  loading: boolean;
  error: string | null;
  lastUpdatedAt: string | null;
  stale: boolean;
  refresh: () => Promise<void>;
  replaceAccount: (account: PwrcCreditAccount) => void;
};

const Context = createContext<Value | null>(null);

export function PwrcCreditsProvider({ children }: PropsWithChildren) {
  const { account: signedInAccount } = useAccount();
  const [account, setAccount] = useState<PwrcCreditAccount | null>(null);
  const [pricing, setPricing] = useState<PwrcPricing | null>(null);
  const [quote, setQuote] = useState<PwrcMessageQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextAccount, nextPricing, nextQuote] = await Promise.all([
        getPwrcCreditAccount(),
        getPwrcPricing(),
        getPwrcMessageQuote(),
      ]);
      setAccount(nextAccount);
      setPricing(nextPricing);
      setQuote(nextQuote);
      setLastUpdatedAt(new Date().toISOString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to refresh PWRC credits.");
      throw cause;
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    if (!signedInAccount) {
      setAccount(null);
      setPricing(null);
      setQuote(null);
      setError(null);
      setLastUpdatedAt(null);
      return;
    }

    void refresh().catch(() => {});
  }, [signedInAccount?.id, refresh]);

  const value = useMemo<Value>(
    () => ({
      account,
      pricing,
      quote,
      loading,
      error,
      lastUpdatedAt,
      stale: Boolean(error && account),
      refresh,
      replaceAccount: setAccount,
    }),
    [account, pricing, quote, loading, error, lastUpdatedAt, refresh],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePwrcCredits() {
  const value = useContext(Context);
  if (!value) throw new Error("usePwrcCredits requires PwrcCreditsProvider");
  return value;
}
