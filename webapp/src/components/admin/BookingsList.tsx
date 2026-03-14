import { Button, Card, Section, Spinner, Text } from '@telegram-apps/telegram-ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { BookingReadable } from '../../../../shared/types';
import { supabase } from '../../services/supabase';

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
      return 'Не пришел';
    default:
      return status;
  }
}

function getStatusStyles(status: string) {
  switch (status) {
    case 'pending':
      return {
        backgroundColor: 'rgba(255, 179, 71, 0.18)',
        color: '#ffcf70',
      };
    case 'active':
      return {
        backgroundColor: 'rgba(76, 175, 80, 0.18)',
        color: '#7ee787',
      };
    case 'completed':
      return {
        backgroundColor: 'rgba(46, 166, 255, 0.18)',
        color: '#73c4ff',
      };
    case 'cancelled':
      return {
        backgroundColor: 'rgba(244, 67, 54, 0.18)',
        color: '#ff8a80',
      };
    default:
      return {
        backgroundColor: 'rgba(142, 142, 147, 0.18)',
        color: '#c7c7cc',
      };
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '88px 1fr',
        gap: '10px',
        alignItems: 'start',
      }}
    >
      <Text
        style={{
          fontSize: '12px',
          lineHeight: 1.4,
          opacity: 0.58,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: '15px', lineHeight: 1.45 }}>{value}</Text>
    </div>
  );
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

      if (error) throw error;
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
    <div>
      <Button size="l" stretched onClick={onAddBooking} style={{ marginBottom: '16px' }}>
        + Добавить запись вручную
      </Button>

      <Section header="Записи">
        {bookings.length === 0 ? (
          <Text style={{ opacity: 0.6, textAlign: 'center', padding: '20px' }}>Нет записей</Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {bookings.map((booking) => {
              const statusStyles = getStatusStyles(booking.status);
              const dateLabel = `${format(new Date(booking.booking_date), 'd MMMM yyyy', {
                locale: ru,
              })} в ${booking.booking_time.substring(0, 5)}`;

              return (
                <Card
                  key={booking.id}
                  style={{
                    padding: '18px',
                    borderRadius: '18px',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}
                      >
                        <Text style={{ fontSize: '19px', fontWeight: 'bold', lineHeight: 1.2 }}>
                          {booking.client_name}
                        </Text>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {booking.client_username && (
                            <Text style={{ fontSize: '14px', opacity: 0.78 }}>
                              Telegram: @{booking.client_username}
                            </Text>
                          )}
                          {booking.client_phone && (
                            <Text style={{ fontSize: '14px', opacity: 0.78 }}>
                              Телефон: {booking.client_phone}
                            </Text>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '8px',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            padding: '6px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 700,
                            lineHeight: 1,
                            ...statusStyles,
                          }}
                        >
                          {getStatusText(booking.status)}
                        </div>
                        <div
                          style={{
                            padding: '6px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            lineHeight: 1,
                            backgroundColor: 'rgba(46, 166, 255, 0.12)',
                            color: '#8ecbff',
                          }}
                        >
                          {getSourceText(booking.source)}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        padding: '14px',
                        borderRadius: '14px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <DetailRow label="Мастер" value={booking.master_name} />
                      <DetailRow label="Услуга" value={booking.service_name} />
                      <DetailRow label="Дата" value={dateLabel} />
                      <DetailRow label="Стоимость" value={`${booking.final_price} ₽`} />
                    </div>

                    {booking.admin_notes && (
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '14px',
                          backgroundColor: 'rgba(255, 193, 7, 0.08)',
                        }}
                      >
                        <Text style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>
                          Заметка
                        </Text>
                        <Text style={{ fontSize: '14px', lineHeight: 1.45 }}>
                          {booking.admin_notes}
                        </Text>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
