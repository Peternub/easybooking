import { Spinner, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { MastersList } from '../components/admin/MastersList';

export function AdminMasters() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверка прав администратора
    const adminTelegramId = import.meta.env.VITE_ADMIN_TELEGRAM_ID;
    const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

    console.log('Admin check:', {
      adminTelegramId,
      currentUserId,
      match: String(currentUserId) === String(adminTelegramId),
    });

    if (currentUserId && adminTelegramId && String(currentUserId) === String(adminTelegramId)) {
      setIsAdmin(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Доступ запрещен</h2>
        <p>У вас нет прав для просмотра админ панели</p>
        <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '20px' }}>
          Откройте консоль браузера (F12) для отладки
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <Title level="1" style={{ marginBottom: '16px' }}>
        Управление мастерами
      </Title>

      <MastersList />
    </div>
  );
}
