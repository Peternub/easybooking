import { Tabbar } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { CalendarView } from '../components/admin/CalendarView';
import { ClientsView } from '../components/admin/ClientsView';
import { ReviewsView } from '../components/admin/ReviewsView';
import { SettingsView } from '../components/admin/SettingsView';

type TabType = 'calendar' | 'clients' | 'reviews' | 'settings';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>Загрузка...</div>
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
    <div style={{ paddingBottom: '80px' }}>
      {activeTab === 'calendar' && <CalendarView />}
      {activeTab === 'clients' && <ClientsView />}
      {activeTab === 'reviews' && <ReviewsView />}
      {activeTab === 'settings' && <SettingsView />}

      <Tabbar style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <Tabbar.Item
          text="Календарь"
          selected={activeTab === 'calendar'}
          onClick={() => setActiveTab('calendar')}
        >
          📅
        </Tabbar.Item>
        <Tabbar.Item
          text="Клиенты"
          selected={activeTab === 'clients'}
          onClick={() => setActiveTab('clients')}
        >
          👥
        </Tabbar.Item>
        <Tabbar.Item
          text="Отзывы"
          selected={activeTab === 'reviews'}
          onClick={() => setActiveTab('reviews')}
        >
          ⭐
        </Tabbar.Item>
        <Tabbar.Item
          text="Настройки"
          selected={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️
        </Tabbar.Item>
      </Tabbar>
    </div>
  );
}
