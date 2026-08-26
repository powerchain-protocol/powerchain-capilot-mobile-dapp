import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { getSessionToken } from "../../api/client";
import {
  getCurrentAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
} from "./api";
import type { Account } from "./types";

type ContextValue = {
  account: Account | null;
  loading: boolean;
  authenticated: boolean;
  refresh: () => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    displayName: string;
  }) => Promise<Account>;
  login: (input: {
    email: string;
    password: string;
  }) => Promise<Account>;
  logout: () => Promise<void>;
};

const AccountContext = createContext<ContextValue | null>(null);

export function AccountProvider({ children }: PropsWithChildren) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getSessionToken();

    if (!token) {
      setAccount(null);
      setLoading(false);
      return;
    }

    try {
      setAccount(await getCurrentAccount());
    } catch {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<ContextValue>(
    () => ({
      account,
      loading,
      authenticated: Boolean(account),
      refresh,
      register: async (input) => {
        const result = await registerAccount(input);
        setAccount(result);
        return result;
      },
      login: async (input) => {
        const result = await loginAccount(input);
        setAccount(result);
        return result;
      },
      logout: async () => {
        await logoutAccount();
        setAccount(null);
      },
    }),
    [account, loading, refresh],
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used inside AccountProvider");
  }
  return context;
}
