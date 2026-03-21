import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { checkAdminAccessApi } from '../../services/api';

type AdminAccessContextValue = {
  isAdmin: boolean;
  loading: boolean;
};

const AdminAccessContext = createContext<AdminAccessContextValue>({
  isAdmin: false,
  loading: true,
});

export function AdminAccessProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = 'easybooking_admin_access';
    const cachedAccess = localStorage.getItem(cacheKey) === 'true';

    if (cachedAccess) {
      setIsAdmin(true);
    }

    async function checkAccess() {
      let currentUserId: number | undefined;

      for (let attempt = 0; attempt < 20; attempt += 1) {
        currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        if (currentUserId) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        const result = await checkAdminAccessApi(currentUserId);
        const nextIsAdmin = Boolean(result.isAdmin);
        setIsAdmin(nextIsAdmin);

        if (nextIsAdmin) {
          localStorage.setItem(cacheKey, 'true');
        } else {
          localStorage.removeItem(cacheKey);
        }
      } catch (error) {
        console.error('Ошибка проверки доступа в админку:', error);
        setIsAdmin(cachedAccess);
      } finally {
        setLoading(false);
      }
    }

    void checkAccess();
  }, []);

  const value = useMemo(
    () => ({
      isAdmin,
      loading,
    }),
    [isAdmin, loading],
  );

  return <AdminAccessContext.Provider value={value}>{children}</AdminAccessContext.Provider>;
}

export function useAdminAccess() {
  return useContext(AdminAccessContext);
}
