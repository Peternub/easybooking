import { Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import type { BookingReadable } from '../../../../shared/types';
import { supabase } from '../../services/supabase';
import { AdminCard, AdminChip, AdminDetailRow, AdminEmptyState } from './AdminTheme';
import { BookingForm } from './BookingForm';

type ViewMode = 'calendar' | 'list';

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

function getDayKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export function BookingsList() {
  const [bookings, setBookings] = useState<BookingReadable[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isCreatingForDay, setIsCreatingForDay] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthAhead = addMonths(new Date(), 3).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('bookings_readable')
        .select('*')
        .gte('booking_date', today)
        .lte('booking_date', monthAhead)
        .in('status', ['active', 'pending'])
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .limit(300);

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

  const bookingsByDate = useMemo(() => {
    return bookings.reduce<Record<string, BookingReadable[]>>((accumulator, booking) => {
      const key = booking.booking_date;
      accumulator[key] = [...(accumulator[key] || []), booking];
      return accumulator;
    }, {});
  }, [bookings]);

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
    });
  }, [currentMonth]);

  const selectedDayBookings = bookingsByDate[getDayKey(selectedDate)] || [];

  function renderBookingCard(booking: BookingReadable) {
    const dateLabel = `${format(parseISO(booking.booking_date), 'd MMMM yyyy', {
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
              <Text
                style={{
                  fontSize: '19px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: 'var(--app-text)',
                }}
              >
                {booking.client_name}
              </Text>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {booking.client_username && (
                  <AdminChip label={`@${booking.client_username}`} tone="blue" />
                )}
                {booking.client_phone && <AdminChip label={booking.client_phone} tone="neutral" />}
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
              backgroundColor: 'var(--app-surface-muted)',
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
                backgroundColor: 'var(--app-accent-soft)',
              }}
            >
              <Text
                style={{ fontSize: '12px', color: 'var(--app-text-soft)', marginBottom: '4px' }}
              >
                Заметка администратора
              </Text>
              <Text style={{ fontSize: '14px', lineHeight: 1.45, color: 'var(--app-text)' }}>
                {booking.admin_notes}
              </Text>
            </div>
          )}
        </div>
      </AdminCard>
    );
  }

  function renderCalendar() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AdminCard style={{ padding: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Text style={{ fontSize: '20px', fontWeight: 700, color: 'var(--app-text)' }}>
                {format(currentMonth, 'LLLL yyyy', { locale: ru })}
              </Text>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  mode="outline"
                  size="s"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  Назад
                </Button>
                <Button
                  mode="outline"
                  size="s"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  Вперед
                </Button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: '6px',
              }}
            >
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                <div
                  key={day}
                  style={{
                    padding: '8px 4px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: 'var(--app-text-soft)',
                    textTransform: 'uppercase',
                  }}
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((day) => {
                const dayKey = getDayKey(day);
                const dayBookings = bookingsByDate[dayKey] || [];
                const isSelected = isSameDay(day, selectedDate);
                const inCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => {
                      setSelectedDate(day);
                      setIsCreatingForDay(true);
                    }}
                    style={{
                      minHeight: '96px',
                      padding: '8px',
                      borderRadius: '16px',
                      border: isSelected
                        ? '1px solid var(--app-accent)'
                        : '1px solid var(--app-border)',
                      background: isSelected ? 'var(--app-accent-soft)' : 'var(--app-surface)',
                      textAlign: 'left',
                      color: 'var(--app-text)',
                      opacity: inCurrentMonth ? 1 : 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: isToday(day) || isSelected ? 700 : 500,
                          color: isToday(day) ? 'var(--app-accent-strong)' : 'var(--app-text-soft)',
                        }}
                      >
                        {format(day, 'd')}
                      </span>
                      {dayBookings.length > 0 && (
                        <span
                          style={{
                            minWidth: '18px',
                            height: '18px',
                            borderRadius: '999px',
                            backgroundColor: 'var(--app-surface-muted)',
                            color: 'var(--app-accent-strong)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          {dayBookings.length}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {dayBookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking.id}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '10px',
                            backgroundColor: booking.status === 'active' ? '#e8d8c7' : '#efdbc4',
                            fontSize: '11px',
                            lineHeight: 1.25,
                            color: 'var(--app-text)',
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>
                            {booking.booking_time.substring(0, 5)}
                          </div>
                          <div
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {booking.client_name}
                          </div>
                        </div>
                      ))}

                      {dayBookings.length > 3 && (
                        <div style={{ fontSize: '11px', color: 'var(--app-text-soft)' }}>
                          + еще {dayBookings.length - 3}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </AdminCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <Text style={{ fontSize: '18px', fontWeight: 700, color: 'var(--app-text)' }}>
              {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
            </Text>
            {isCreatingForDay && (
              <Button mode="outline" size="s" onClick={() => setIsCreatingForDay(false)}>
                Скрыть форму
              </Button>
            )}
          </div>

          {isCreatingForDay && (
            <BookingForm
              hideBackButton
              initialDate={getDayKey(selectedDate)}
              onSaved={() => {
                setIsCreatingForDay(false);
                loadBookings();
              }}
            />
          )}

          {selectedDayBookings.length === 0 ? (
            <AdminEmptyState text="На выбранный день записей нет." />
          ) : (
            selectedDayBookings.map((booking) => (
              <AdminCard key={booking.id} style={{ padding: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '10px',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Text style={{ fontSize: '18px', fontWeight: 700, color: 'var(--app-text)' }}>
                        {booking.booking_time.substring(0, 5)} · {booking.client_name}
                      </Text>
                      <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>
                        {booking.master_name} · {booking.service_name}
                      </Text>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <AdminChip
                        label={getStatusText(booking.status)}
                        tone={getStatusTone(booking.status)}
                      />
                      <AdminChip label={`${booking.final_price} ₽`} tone="blue" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {booking.client_username && (
                      <AdminChip label={`@${booking.client_username}`} tone="blue" />
                    )}
                    {booking.client_phone && (
                      <AdminChip label={booking.client_phone} tone="neutral" />
                    )}
                    <AdminChip
                      label={getSourceText(booking.source)}
                      tone={getSourceTone(booking.source)}
                    />
                  </div>
                </div>
              </AdminCard>
            ))
          )}
        </div>
      </div>
    );
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
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          mode={viewMode === 'calendar' ? 'filled' : 'outline'}
          size="s"
          onClick={() => setViewMode('calendar')}
          style={{ flex: 1 }}
        >
          Календарь
        </Button>
        <Button
          mode={viewMode === 'list' ? 'filled' : 'outline'}
          size="s"
          onClick={() => setViewMode('list')}
          style={{ flex: 1 }}
        >
          Список
        </Button>
      </div>

      {bookings.length === 0 ? (
        <AdminEmptyState text="Ближайших записей нет." />
      ) : viewMode === 'calendar' ? (
        renderCalendar()
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {bookings.map((booking) => renderBookingCard(booking))}
        </div>
      )}
    </div>
  );
}
