import { Button, Card, Section, Spinner, Text } from '@telegram-apps/telegram-ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { BookingReadable } from '../../../../shared/types';
import { supabase } from '../../services/supabase';

interface Props {
  onAddBooking: () => void;
}

export function BookingsList({ onAddBooking }: Props) {
  const [bookings, setBookings] = useState<BookingReadable[]>([]);
  const [loading, setLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: загружаем записи при монтировании
  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      console.log('Загрузка предстоящих записей');

      const today = new Date().toISOString().split('T')[0];
      console.log('Сегодня:', today);

      const { data, error } = await supabase
        .from('bookings_readable')
        .select('*')
        .gte('booking_date', today)
        .in('status', ['active', 'pending'])
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Ошибка Supabase:', error);
        throw error;
      }

      console.log('Загружено записей:', data?.length || 0);
      console.log('Данные:', data);

      setBookings(data || []);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
      alert('Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Ожидает';
      case 'active':
        return '✅ Активна';
      case 'completed':
        return '✔️ Завершена';
      case 'cancelled':
        return '❌ Отменена';
      case 'no_show':
        return '👻 Не пришел';
      default:
        return status;
    }
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'online':
        return '🤖 Онлайн';
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  return (
    <div>
      <Button size="l" stretched onClick={onAddBooking} style={{ marginBottom: '16px' }}>
        + Добавить запись вручную
      </Button>

      {/* Информационная подсказка */}
      <Card style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'var(--tgui--secondary_bg_color)' }}>
        <Text style={{ fontSize: '13px', opacity: 0.8, textAlign: 'center' }}>
          ℹ️ Для отмены нескольких записей подряд обновляйте страницу после каждой отмены
        </Text>
      </Card>

      <Section header="Записи">
        {bookings.length === 0 ? (
          <Text style={{ opacity: 0.6, textAlign: 'center', padding: '20px' }}>Нет записей</Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bookings.map((booking) => (
              <Card key={booking.id} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                    }}
                  >
                    <div>
                      <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {booking.client_name}
                      </Text>
                      {booking.client_phone && (
                        <Text style={{ fontSize: '14px', opacity: 0.7 }}>
                          📞 {booking.client_phone}
                        </Text>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text style={{ fontSize: '12px' }}>{getStatusText(booking.status)}</Text>
                      <Text style={{ fontSize: '12px', opacity: 0.6 }}>
                        {getSourceText(booking.source)}
                      </Text>
                    </div>
                  </div>

                  <div>
                    <Text style={{ fontSize: '14px' }}>👤 {booking.master_name}</Text>
                    <Text style={{ fontSize: '14px' }}>💼 {booking.service_name}</Text>
                    <Text style={{ fontSize: '14px' }}>
                      📅 {format(new Date(booking.booking_date), 'd MMMM yyyy', { locale: ru })} в{' '}
                      {booking.booking_time.substring(0, 5)}
                    </Text>
                    <Text style={{ fontSize: '14px' }}>💰 {booking.final_price} ₽</Text>
                  </div>

                  {booking.admin_notes && (
                    <Text style={{ fontSize: '12px', opacity: 0.6, fontStyle: 'italic' }}>
                      📝 {booking.admin_notes}
                    </Text>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
