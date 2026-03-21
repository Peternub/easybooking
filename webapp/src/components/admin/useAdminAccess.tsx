import { createContext, useContext, useMemo, type ReactNode } from 'react';

type AdminAccessContextValue = {
  isAdmin: boolean;
  loading: boolean;
};

const AdminAccessContext = createContext<AdminAccessContextValue>({
  isAdmin: false,
  loading: true,
});

export function AdminAccessProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      isAdmin: true,
      loading: false,
    }),
    [],
  );

  return <AdminAccessContext.Provider value={value}>{children}</AdminAccessContext.Provider>;
}

export function useAdminAccess() {
  return useContext(AdminAccessContext);
}
