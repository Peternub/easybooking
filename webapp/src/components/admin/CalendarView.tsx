import { Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import { addDays, format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { BookingReadable, Master } from '../../../../shared/types';
import { getAdminBookingsApi, getAdminMastersApi } from '../../services/api';
import { AdminCard, AdminChip, AdminEmptyState } from './AdminTheme';

function getStatusText(status: string) {
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

function getEffectiveBookingStatus(booking: BookingReadable): BookingReadable['status'] {
  if (!['active', 'pending'].includes(booking.status)) {
    return booking.status;
  }

  const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
  return bookingDateTime.getTime() <= Date.now() ? 'completed' : booking.status;
}

function isUpcomingBooking(booking: BookingReadable): boolean {
  if (!['active', 'pending'].includes(booking.status)) {
    return false;
  }

  const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
  return bookingDateTime.getTime() > Date.now();
}

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [bookings, setBookings] = useState<BookingReadable[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  useEffect(() => {
    loadData(selectedDate, viewMode);
  }, [selectedDate, viewMode]);

  async function loadData(date: Date, mode: 'day' | 'week') {
    setLoading(true);

    try {
      const startDate = format(date, 'yyyy-MM-dd');
      const endDate = mode === 'day' ? startDate : format(addDays(date, 6), 'yyyy-MM-dd');

      const [bookingsData, mastersData] = await Promise.all([
        getAdminBookingsApi(startDate, endDate, ['active', 'pending']),
        getAdminMastersApi(),
      ]);

      setBookings(bookingsData.filter(isUpcomingBooking));
      setMasters(mastersData.filter((master) => master.is_active));
    } catch (error) {
      console.error('Ошибка загрузки календаря:', error);
      alert('Не удалось загрузить календарь');
    } finally {
      setLoading(false);
    }
  }

  const bookingsByMaster = masters.map((master) => ({
    master,
    bookings: bookings.filter((booking) => booking.master_name === master.name),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <AdminCard style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
          <Button mode="outline" size="s" onClick={() => setSelectedDate(startOfDay(new Date()))}>
            Сегодня
          </Button>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          <Button
            mode="outline"
            size="s"
            onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? -1 : -7))}
          >
            Назад
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
                  style={{ minWidth: '88px' }}
                >
                  {offset === 0 ? 'Сегодня' : format(date, 'd MMM', { locale: ru })}
                </Button>
              );
            })
          ) : (
            <Button mode="filled" size="s" style={{ minWidth: '220px' }}>
              {format(selectedDate, 'd MMM', { locale: ru })} -{' '}
              {format(addDays(selectedDate, 6), 'd MMM', { locale: ru })}
            </Button>
          )}

          <Button
            mode="outline"
            size="s"
            onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? 1 : 7))}
          >
            Вперед
          </Button>
        </div>
      </AdminCard>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner size="l" />
        </div>
      ) : bookingsByMaster.length === 0 ? (
        <AdminEmptyState text="Нет активных мастеров для отображения календаря." />
      ) : (
        bookingsByMaster.map(({ master, bookings: masterBookings }) => (
          <div key={master.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Text style={{ fontSize: '18px', fontWeight: 700, color: 'var(--app-text)' }}>
              {master.name}
            </Text>

            {masterBookings.length === 0 ? (
              <AdminEmptyState text="На выбранный период записей нет." />
            ) : (
              masterBookings.map((booking) => (
                <AdminCard key={booking.id} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '10px',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <Text
                          style={{ fontSize: '18px', fontWeight: 700, color: 'var(--app-text)' }}
                        >
                          {booking.booking_time.substring(0, 5)} · {booking.client_name}
                        </Text>
                        <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>
                          {booking.service_name}
                        </Text>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <AdminChip
                          label={getStatusText(getEffectiveBookingStatus(booking))}
                          tone={getStatusTone(getEffectiveBookingStatus(booking))}
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
                    </div>
                  </div>
                </AdminCard>
              ))
            )}
          </div>
        ))
      )}
    </div>
  );
}
