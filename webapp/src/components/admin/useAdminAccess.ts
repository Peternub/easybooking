import { useEffect, useState } from 'react';
import { checkAdminAccessApi } from '../../services/api';

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

    async function checkAccess() {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        const result = await checkAdminAccessApi(currentUserId);
        setIsAdmin(Boolean(result.isAdmin));
      } catch (error) {
        console.error('Ошибка проверки доступа в админку:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    void checkAccess();
  }, []);

  return { isAdmin, loading };
}
