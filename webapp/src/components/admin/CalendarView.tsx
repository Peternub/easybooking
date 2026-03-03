import { Button, Card, Spinner, Text, Title } from '@telegram-apps/telegram-ui';
import { addDays, format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { BookingReadable, Master } from '../../../../shared/types';
import { supabase } from '../../services/supabase';

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [bookings, setBookings] = useState<BookingReadable[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedDate нужен для перезагрузки
  useEffect(() => {
    loadData();
  }, [selectedDate]);

  async function loadData() {
    setLoading(true);
    try {
      let bookingsData: BookingReadable[] = [];

      if (viewMode === 'day') {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('bookings_readable')
          .select('*')
          .eq('booking_date', dateStr)
          .order('booking_time');

        if (error) throw error;
        bookingsData = data || [];
      } else {
        // Неделя: загружаем записи на 7 дней начиная с выбранной даты
        const startDate = format(selectedDate, 'yyyy-MM-dd');
        const endDate = format(addDays(selectedDate, 6), 'yyyy-MM-dd');
        
        const { data, error } = await supabase
          .from('bookings_readable')
          .select('*')
          .gte('booking_date', startDate)
          .lte('booking_date', endDate)
          .order('booking_date')
          .order('booking_time');

        if (error) throw error;
        bookingsData = data || [];
      }

      // Загружаем мастеров
      const { data: mastersData, error: mastersError } = await supabase
        .from('masters')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (mastersError) throw mastersError;

      setBookings(bookingsData);
      setMasters(mastersData || []);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'active':
        return '✅';
      case 'completed':
        return '✓';
      case 'cancelled':
        return '❌';
      case 'no_show':
        return '👻';
      default:
        return '•';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'active':
        return 'Подтверждена';
      case 'completed':
        return 'Завершена';
      case 'cancelled':
        return 'Отменена';
      case 'no_show':
        return 'Не пришел';
      default:
        return status;
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'online':
        return '🌐 Онлайн';
      case 'manual':
        return '✍️ Вручную';
      case 'phone':
        return '📞 Телефон';
      case 'walk_in':
        return '🚶 С улицы';
      default:
        return source;
    }
  };

  // Группируем записи по мастерам
  const bookingsByMaster = masters.map((master) => ({
    master,
    bookings: bookings.filter((b) => b.master_name === master.name),
  }));

  return (
    <div style={{ padding: '16px' }}>
      <Title level="1" style={{ marginBottom: '16px' }}>
        Календарь записей
      </Title>

      {/* Переключатель вида */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Button
          mode={viewMode === 'day' ? 'filled' : 'outline'}
          size="s"
          onClick={() => setViewMode('day')}
        >
          День
        </Button>
        <Button
          mode={viewMode === 'week' ? 'filled' : 'outline'}
          size="s"
          onClick={() => setViewMode('week')}
        >
          Неделя
        </Button>
      </div>

      {/* Навигация по датам */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
        <Button
          mode="outline"
          size="s"
          onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? -1 : -7))}
        >
          ←
        </Button>
        {viewMode === 'day' ? (
          [-1, 0, 1, 2, 3, 4, 5].map((offset) => {
            const date = addDays(startOfDay(new Date()), offset);
            const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

            return (
              <Button
                key={offset}
                mode={isSelected ? 'filled' : 'outline'}
                size="s"
                onClick={() => setSelectedDate(date)}
                style={{ minWidth: '80px' }}
              >
                {offset === 0 ? 'Сегодня' : format(date, 'd MMM', { locale: ru })}
              </Button>
            );
          })
        ) : (
          <Button mode="filled" size="s" style={{ minWidth: '200px' }}>
            {format(selectedDate, 'd MMM', { locale: ru })} -{' '}
            {format(addDays(selectedDate, 6), 'd MMM', { locale: ru })}
          </Button>
        )}
        <Button
          mode="outline"
          size="s"
          onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? 1 : 7))}
        >
          →
        </Button>
      </div>

      {/* Кнопка "Сегодня" */}
      <Button
        size="m"
        stretched
        mode="outline"
        onClick={() => setSelectedDate(startOfDay(new Date()))}
        style={{ marginBottom: '16px' }}
      >
        📅 Вернуться к сегодня
      </Button>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner size="l" />
        </div>
      ) : (
        <>
          {/* Статистика за день */}
          <Card style={{ padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>{bookings.length}</Text>
                <Text style={{ fontSize: '12px', opacity: 0.6 }}>Всего</Text>
              </div>
              <div>
                <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {bookings.filter((b) => b.status === 'active').length}
                </Text>
                <Text style={{ fontSize: '12px', opacity: 0.6 }}>Активных</Text>
              </div>
              <div>
                <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {bookings.filter((b) => b.status === 'completed').length}
                </Text>
                <Text style={{ fontSize: '12px', opacity: 0.6 }}>Завершено</Text>
              </div>
            </div>
          </Card>

          {/* Записи по мастерам */}
          {bookingsByMaster.map(({ master, bookings: masterBookings }) => (
            <div key={master.id} style={{ marginBottom: '24px' }}>
              <Title level="3" style={{ marginBottom: '12px' }}>
                {master.name}
              </Title>

              {masterBookings.length === 0 ? (
                <Card style={{ padding: '16px', opacity: 0.6 }}>
                  <Text>Нет записей</Text>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {masterBookings.map((booking) => (
                    <Card
                      key={booking.id}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderLeft: `4px solid ${
                          booking.status === 'active'
                            ? '#4CAF50'
                            : booking.status === 'completed'
                              ? '#2196F3'
                              : booking.status === 'cancelled'
                                ? '#F44336'
                                : '#FFC107'
                        }`,
                      }}
                      onClick={() => {
                        // TODO: Открыть модалку с деталями
                        console.log('Открыть запись:', booking.id);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                              {booking.booking_time.substring(0, 5)}
                            </Text>
                            <Text style={{ fontSize: '14px' }}>{booking.client_name}</Text>
                          </div>
                          <Text style={{ fontSize: '14px', opacity: 0.8 }}>
                            {booking.service_name}
                          </Text>
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              marginTop: '4px',
                              fontSize: '12px',
                            }}
                          >
                            <Text style={{ opacity: 0.6 }}>
                              {getStatusEmoji(booking.status)} {getStatusText(booking.status)}
                            </Text>
                            <Text style={{ opacity: 0.6 }}>{getSourceText(booking.source)}</Text>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                            {booking.final_price} ₽
                          </Text>
                          {booking.promo_code && (
                            <Text style={{ fontSize: '12px', color: '#4CAF50' }}>
                              {booking.promo_code}
                            </Text>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
