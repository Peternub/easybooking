import { Button, Card, Section, Spinner, Text } from '@telegram-apps/telegram-ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';
import type { BookingReadable } from '../../../../shared/types';
import { supabase } from '../../services/supabase';

interface Props {
  onAddBooking: () => void;
}

export function BookingsList({ onAddBooking }: Props) {
  const [bookings, setBookings] = useState<BookingReadable[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: filter нужен для перезагрузки при смене фильтра
  useEffect(() => {
    loadBookings();
  }, [filter]);

  // Фокус на textarea при открытии модалки
  useEffect(() => {
    if (cancellingBookingId && textareaRef.current) {
      // Небольшая задержка для корректной работы
      setTimeout(() => {
        textareaRef.current?.focus();
        // Принудительно делаем элемент интерактивным
        textareaRef.current?.click();
      }, 150);
    }
  }, [cancellingBookingId]);

  async function loadBookings() {
    try {
      console.log('Загрузка записей, фильтр:', filter);

      let query = supabase.from('bookings_readable').select('*');

      const today = new Date().toISOString().split('T')[0];
      console.log('Сегодня:', today);

      if (filter === 'upcoming') {
        query = query.gte('booking_date', today).in('status', ['active', 'pending']);
        console.log('Фильтр: предстоящие записи (>= сегодня, статус active/pending)');
      } else if (filter === 'past') {
        query = query.lt('booking_date', today);
        console.log('Фильтр: прошедшие записи (< сегодня)');
      } else {
        console.log('Фильтр: все записи');
      }

      const { data, error } = await query
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

  async function handleCancelBooking(bookingId: string) {
    setCancellationReason(''); // Очищаем причину перед открытием модалки
    setCancellingBookingId(bookingId);
  }

  async function confirmCancelBooking() {
    if (!cancellingBookingId) return;

    console.log('Начало отмены записи:', cancellingBookingId);

    if (!cancellationReason.trim()) {
      alert('Укажите причину отмены');
      return;
    }

    try {
      // Получаем полную информацию о записи
      const booking = bookings.find((b) => b.id === cancellingBookingId);
      if (!booking) {
        console.error('Запись не найдена:', cancellingBookingId);
        return;
      }

      console.log('Найдена запись:', booking);

      // Обновляем статус записи
      const { data: updateData, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: cancellationReason.trim(),
        })
        .eq('id', cancellingBookingId)
        .select();

      if (error) {
        console.error('Ошибка обновления статуса:', error);
        alert(`Ошибка обновления: ${error.message}`);
        throw error;
      }

      console.log('Статус записи обновлен на cancelled, результат:', updateData);

      if (!updateData || updateData.length === 0) {
        console.error('Запись не была обновлена - возможно проблема с правами доступа');
        alert('Запись не была обновлена. Проверьте права доступа в Supabase.');
        return;
      }

      // Отправляем уведомление клиенту через бота (если это онлайн запись)
      if (booking.source === 'online') {
        try {
          // Получаем telegram_id клиента из таблицы bookings
          const { data: bookingData, error: bookingError } = await supabase
            .from('bookings')
            .select('client_telegram_id')
            .eq('id', cancellingBookingId)
            .single();

          if (bookingError) {
            console.error('Ошибка получения данных записи:', bookingError);
          }

          console.log('Данные записи для уведомления:', bookingData);

          if (bookingData?.client_telegram_id && bookingData.client_telegram_id !== 0) {
            const botApiUrl = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';
            const notifyUrl = `${botApiUrl}/api/notify-cancellation`;

            console.log('Отправка уведомления на:', notifyUrl);
            console.log('Данные уведомления:', {
              clientTelegramId: bookingData.client_telegram_id,
              bookingId: cancellingBookingId,
              reason: cancellationReason.trim(),
            });

            const response = await fetch(notifyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientTelegramId: bookingData.client_telegram_id,
                bookingId: cancellingBookingId,
                reason: cancellationReason.trim(),
                bookingDate: booking.booking_date,
                bookingTime: booking.booking_time,
                masterName: booking.master_name,
                serviceName: booking.service_name,
              }),
            });

            const result = await response.json();
            console.log('Результат отправки уведомления:', result);

            if (!response.ok) {
              console.error('Ошибка API:', result);
            }
          } else {
            console.log('Уведомление не отправлено: нет telegram_id клиента');
          }
        } catch (notifyError) {
          console.error('Ошибка отправки уведомления:', notifyError);
          // Продолжаем даже если не удалось отправить уведомление
        }
      } else {
        console.log(
          'Уведомление не отправлено: запись создана не через бота (source:',
          booking.source,
          ')',
        );
      }

      alert('Запись отменена');
      setCancellingBookingId(null);
      setCancellationReason('');
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

      {/* Информационная подсказка */}
      <Card style={{ padding: '12px', marginBottom: '16px', backgroundColor: 'var(--tgui--secondary_bg_color)' }}>
        <Text style={{ fontSize: '13px', opacity: 0.8, textAlign: 'center' }}>
          ℹ️ Для отмены нескольких записей подряд обновляйте страницу после каждой отмены
        </Text>
      </Card>

      {/* Модальное окно для отмены записи */}
      {cancellingBookingId && (
        <div
          key={`modal-${cancellingBookingId}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => {
            setCancellingBookingId(null);
            setCancellationReason('');
          }}
        >
          <Card
            style={{ padding: '20px', maxWidth: '400px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Отмена записи
            </Text>
            <Text style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.8 }}>
              Укажите причину отмены. Клиент получит уведомление с этим сообщением.
            </Text>
            <textarea
              ref={textareaRef}
              key={`cancel-reason-${cancellingBookingId}`}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.currentTarget.focus();
              }}
              onFocus={(e) => {
                // Прокручиваем элемент в видимую область
                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              placeholder="Например: Мастер заболел, запись перенесена на другое время"
              rows={4}
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '16px',
                borderRadius: '8px',
                border: '1px solid var(--tgui--secondary_bg_color)',
                backgroundColor: 'var(--tgui--bg_color)',
                color: 'var(--tgui--text_color)',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                WebkitUserSelect: 'text',
                userSelect: 'text',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                mode="filled"
                size="m"
                onClick={confirmCancelBooking}
                style={{ flex: 1, backgroundColor: '#F44336' }}
              >
                Отменить запись
              </Button>
              <Button
                mode="outline"
                size="m"
                onClick={() => {
                  setCancellingBookingId(null);
                  setCancellationReason('');
                }}
                style={{ flex: 1 }}
              >
                Назад
              </Button>
            </div>
          </Card>
        </div>
      )}

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
