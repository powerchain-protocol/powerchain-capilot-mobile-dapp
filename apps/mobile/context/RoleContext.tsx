import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import type { OperationalRole } from '@/types/roles';

const RoleContext = createContext<{
  role: OperationalRole;
  availableRoles: OperationalRole[];
  setRole: (role: OperationalRole) => void;
} | null>(null);

export function RoleProvider({ children }: PropsWithChildren) {
  const { session } = useAuthSession();
  const availableRoles = session?.roles?.length ? session.roles : ['operator' as const];
  const [role, setRoleState] = useState<OperationalRole>(availableRoles[0]);

  useEffect(() => {
    if (!availableRoles.includes(role)) setRoleState(availableRoles[0]);
  }, [availableRoles, role]);

  const value = useMemo(() => ({
    role,
    availableRoles,
    setRole(next: OperationalRole) {
      if (!availableRoles.includes(next)) return;
      setRoleState(next);
    },
  }), [availableRoles, role]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useOperationalRole() {
  const value = useContext(RoleContext);
  if (!value) throw new Error('useOperationalRole must be used inside RoleProvider.');
  return value;
}
