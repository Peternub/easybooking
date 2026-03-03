import { Button, Spinner, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import { BookingForm } from '../components/admin/BookingForm';
import { BookingsList } from '../components/admin/BookingsList';
import { CalendarView } from '../components/admin/CalendarView';

export function AdminBookings() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    // Проверка прав администратора
    const adminTelegramId = import.meta.env.VITE_ADMIN_TELEGRAM_ID;
    const currentUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

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
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <Title level="1" style={{ marginBottom: '16px' }}>
        Управление записями
      </Title>

      {!showForm && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Button
            mode={viewMode === 'list' ? 'filled' : 'outline'}
            size="m"
            onClick={() => setViewMode('list')}
            style={{ flex: 1 }}
          >
            📋 Список
          </Button>
          <Button
            mode={viewMode === 'calendar' ? 'filled' : 'outline'}
            size="m"
            onClick={() => setViewMode('calendar')}
            style={{ flex: 1 }}
          >
            📅 Календарь
          </Button>
        </div>
      )}

      {showForm ? (
        <BookingForm 
          onClose={() => {
            setShowForm(false);
            setRefreshKey(prev => prev + 1); // Принудительно обновляем список
          }} 
        />
      ) : viewMode === 'calendar' ? (
        <CalendarView />
      ) : (
        <BookingsList 
          key={refreshKey} 
          onAddBooking={() => setShowForm(true)} 
        />
      )}
    </div>
  );
}
