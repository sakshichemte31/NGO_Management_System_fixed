import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Role } from '../types/project';

interface RoleCtx { role: Role; canEdit: boolean; isAdmin: boolean }
const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const role: Role = user?.role === 'Admin' ? 'Admin' : user?.role === 'Project Manager' ? 'Project Manager' : 'Viewer';
  const value = useMemo<RoleCtx>(() => ({ role, canEdit: role === 'Admin', isAdmin: role === 'Admin' }), [role]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useRole(): RoleCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useRole must be used inside <RoleProvider>');
  return c;
}
