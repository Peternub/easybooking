import { Spinner, Text } from '@telegram-apps/telegram-ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { BookingReadable } from '../../../../shared/types';
import { supabase } from '../../services/supabase';
import {
  AdminCard,
  AdminChip,
  AdminDetailRow,
  AdminEmptyState,
  AdminPrimaryButton,
} from './AdminTheme';

interface Props {
  onAddBooking: () => void;
}

function getStatusText(status: string) {
  switch (status) {
    case 'pending':
      return 'Ожидает';
    case 'active':
      return 'Активна';
    case 'completed':
      return 'Завершена';
    case 'cancelled':
      return 'Отменена';
    case 'no_show':
      return 'Не пришёл';
    default:
      return status;
  }
}

function getStatusTone(status: string): 'green' | 'orange' | 'blue' | 'red' | 'neutral' {
  switch (status) {
    case 'pending':
      return 'orange';
    case 'active':
      return 'green';
    case 'completed':
      return 'blue';
    case 'cancelled':
    case 'no_show':
      return 'red';
    default:
      return 'neutral';
  }
}

function getSourceText(source: string) {
  switch (source) {
    case 'online':
      return 'Онлайн';
    case 'manual':
      return 'Вручную';
    case 'phone':
      return 'Телефон';
    case 'walk_in':
      return 'С улицы';
    default:
      return source;
  }
}

function getSourceTone(source: string): 'blue' | 'orange' | 'green' | 'neutral' {
  switch (source) {
    case 'online':
      return 'blue';
    case 'manual':
      return 'orange';
    case 'phone':
      return 'green';
    default:
      return 'neutral';
  }
}

export function BookingsList({ onAddBooking }: Props) {
  const [bookings, setBookings] = useState<BookingReadable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('bookings_readable')
        .select('*')
        .gte('booking_date', today)
        .in('status', ['active', 'pending'])
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(50);

      if (error) {
        throw error;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
      alert('Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <AdminPrimaryButton stretched onClick={onAddBooking}>
        + Добавить запись вручную
      </AdminPrimaryButton>

      {bookings.length === 0 ? (
        <AdminEmptyState text="Ближайших записей нет." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {bookings.map((booking) => {
            const dateLabel = `${format(new Date(booking.booking_date), 'd MMMM yyyy', {
              locale: ru,
            })} в ${booking.booking_time.substring(0, 5)}`;

            return (
              <AdminCard key={booking.id}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <Text style={{ fontSize: '19px', fontWeight: 700, lineHeight: 1.2 }}>
                        {booking.client_name}
                      </Text>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {booking.client_username && (
                          <AdminChip label={`@${booking.client_username}`} tone="blue" />
                        )}
                        {booking.client_phone && (
                          <AdminChip label={booking.client_phone} tone="neutral" />
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <AdminChip
                        label={getStatusText(booking.status)}
                        tone={getStatusTone(booking.status)}
                      />
                      <AdminChip
                        label={getSourceText(booking.source)}
                        tone={getSourceTone(booking.source)}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      padding: '14px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(255,255,255,0.035)',
                    }}
                  >
                    <AdminDetailRow label="Мастер" value={booking.master_name} />
                    <AdminDetailRow label="Услуга" value={booking.service_name} />
                    <AdminDetailRow label="Дата" value={dateLabel} />
                    <AdminDetailRow label="Стоимость" value={`${booking.final_price} ₽`} />
                  </div>

                  {booking.admin_notes && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 193, 7, 0.08)',
                      }}
                    >
                      <Text style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
                        Заметка администратора
                      </Text>
                      <Text style={{ fontSize: '14px', lineHeight: 1.45 }}>
                        {booking.admin_notes}
                      </Text>
                    </div>
                  )}
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
