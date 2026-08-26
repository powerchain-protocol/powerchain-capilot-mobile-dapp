import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';
import type { OperationalRole } from '@/types/roles';

export type AuthSession = {
  userId: string;
  accessToken: string;
  organizationId?: string;
  roles?: OperationalRole[];
};

type AuthSessionContextValue = {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const value = useMemo(() => ({ session, setSession }), [session]);
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const value = useContext(AuthSessionContext);
  if (!value) throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  return value;
}
