import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { checkAdminAccessApi } from '../../services/api';

type AdminAccessContextValue = {
  isAdmin: boolean;
  loading: boolean;
};

const AdminAccessContext = createContext<AdminAccessContextValue>({
  isAdmin: false,
  loading: true,
});

function getTelegramUserId() {
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
}

export function AdminAccessProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const verifyAccess = async () => {
      const telegramId = getTelegramUserId();

      if (!telegramId) {
        attempts += 1;

        if (attempts < 20) {
          setTimeout(() => {
            if (!cancelled) {
              void verifyAccess();
            }
          }, 250);
          return;
        }

        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await checkAdminAccessApi(telegramId);

        if (!cancelled) {
          setIsAdmin(response.isAdmin);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }

    void verifyAccess();

    return () => {
      cancelled = true;
    };
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
