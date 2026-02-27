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
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  // biome-ignore lint/correctness/useExhaustiveDependencies: filter нужен для перезагрузки при смене фильтра
  useEffect(() => {
    loadBookings();
  }, [filter]);

  async function loadBookings() {
    try {
      let query = supabase.from('bookings_readable').select('*');

      const today = new Date().toISOString().split('T')[0];

      if (filter === 'upcoming') {
        query = query.gte('booking_date', today).in('status', ['active', 'pending']);
      } else if (filter === 'past') {
        query = query.lt('booking_date', today);
      }

      const { data, error } = await query
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false })
        .limit(50);

      if (error) throw error;

      setBookings(data || []);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
      alert('Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking(bookingId: string) {
    if (!confirm('Отменить эту запись?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      alert('Запись отменена');
      loadBookings();
    } catch (error) {
      console.error('Ошибка отмены записи:', error);
      alert('Не удалось отменить запись');
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

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
        <Button
          mode={filter === 'upcoming' ? 'filled' : 'outline'}
          size="s"
          onClick={() => setFilter('upcoming')}
        >
          Предстоящие
        </Button>
        <Button
          mode={filter === 'past' ? 'filled' : 'outline'}
          size="s"
          onClick={() => setFilter('past')}
        >
          Прошедшие
        </Button>
        <Button
          mode={filter === 'all' ? 'filled' : 'outline'}
          size="s"
          onClick={() => setFilter('all')}
        >
          Все
        </Button>
      </div>

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

                  {booking.status === 'active' && (
                    <Button
                      mode="outline"
                      size="s"
                      onClick={() => handleCancelBooking(booking.id)}
                      style={{ color: '#F44336', marginTop: '8px' }}
                    >
                      Отменить запись
                    </Button>
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
