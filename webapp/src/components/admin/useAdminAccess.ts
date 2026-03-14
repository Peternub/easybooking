import { useEffect, useState } from 'react';

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminTelegramId = import.meta.env.VITE_ADMIN_TELEGRAM_ID;
    const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

    if (currentUserId && adminTelegramId && String(currentUserId) === String(adminTelegramId)) {
      setIsAdmin(true);
    }

    setLoading(false);
  }, []);

  return { isAdmin, loading };
}
