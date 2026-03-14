import { Button, Placeholder, Spinner, Text, Title } from '@telegram-apps/telegram-ui';
import { addDays, format, isPast, parse, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { backButtonStyle, pageShellStyle, softPanelStyle, titleStyle } from './AppTheme';

interface Props {
  masterId: string;
  onSelect: (date: string, time: string) => void;
  onBack: () => void;
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
  isPast: boolean;
}

export function SelectDateTime({ masterId, onSelect, onBack }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: masterId нужен при смене мастера
  useEffect(() => {
    loadAvailableDates();
  }, [masterId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedDate и masterId нужны при смене мастера и даты
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, masterId]);

  async function loadAvailableDates() {
    try {
      const dates: string[] = [];
      const today = startOfDay(new Date());

      for (let index = 0; index < 14; index++) {
        const date = addDays(today, index);
        dates.push(format(date, 'yyyy-MM-dd'));
      }

      const { data: absences, error } = await supabase
        .from('master_absences')
        .select('start_date, end_date')
        .eq('master_id', masterId);

      if (error) {
        console.error('Ошибка загрузки отпусков:', error);
      }

      const availableDatesFiltered = dates.filter((date) => {
        if (!absences) {
          return true;
        }

        return !absences.some((absence) => {
          const checkDate = new Date(date);
          const startDate = new Date(absence.start_date);
          const endDate = new Date(absence.end_date);
          return checkDate >= startDate && checkDate <= endDate;
        });
      });

      setAvailableDates(availableDatesFiltered);
    } catch (err) {
      console.error('Ошибка загрузки дат:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableSlots(date: string) {
    setLoadingSlots(true);

    try {
      const { data: master, error: masterError } = await supabase
        .from('masters')
        .select('work_schedule')
        .eq('id', masterId)
        .single();

      if (masterError) {
        console.error('Ошибка загрузки мастера:', masterError);
        setTimeSlots([]);
        return;
      }

      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();
      const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const dayName = dayNames[dayOfWeek];

      const workSchedule = master?.work_schedule || {};
      const daySchedule = workSchedule[dayName] || [];

      if (daySchedule.length === 0) {
        setTimeSlots([]);
        return;
      }

      const allSlots: string[] = [];

      for (const timeRange of daySchedule) {
        const [startTime, endTime] = timeRange.split('-');
        if (!startTime || !endTime) {
          continue;
        }

        const [startHour] = startTime.split(':').map(Number);
        const [endHour] = endTime.split(':').map(Number);

        for (let hour = startHour; hour < endHour; hour++) {
          allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('booking_time')
        .eq('master_id', masterId)
        .eq('booking_date', date)
        .in('status', ['pending', 'active', 'completed']);

      if (error) {
        console.error('Ошибка загрузки записей:', error);
      }

      const bookedTimes = new Set(
        bookings?.map((booking) => booking.booking_time.substring(0, 5)) || [],
      );

      const slots: TimeSlot[] = allSlots.map((time) => {
        const slotDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
        const isBooked = bookedTimes.has(time);
        const isTimePast = isPast(slotDateTime);

        return {
          time,
          isAvailable: !isBooked && !isTimePast,
          isPast: isTimePast,
        };
      });

      setTimeSlots(slots);
    } catch (err) {
      console.error('Ошибка загрузки слотов:', err);
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
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
    <div style={pageShellStyle}>
      <Button mode="plain" onClick={onBack} style={backButtonStyle}>
        Назад
      </Button>

      <Title level="1" style={titleStyle}>
        Выберите дату и время
      </Title>

      {!selectedDate ? (
        <>
          {availableDates.length === 0 ? (
            <Placeholder
              header="Мастер недоступен"
              description="К сожалению, мастер находится в отпуске или недоступен в ближайшие 14 дней"
            />
          ) : (
            <>
              <Text style={{ color: 'var(--app-text-soft)' }}>Выберите дату:</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {availableDates.map((date) => (
                  <Button
                    key={date}
                    mode="filled"
                    size="m"
                    onClick={() => setSelectedDate(date)}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--app-surface)',
                      color: 'var(--app-text)',
                      border: '1px solid var(--app-border)',
                      borderRadius: '16px',
                      boxShadow: 'none',
                    }}
                  >
                    {format(new Date(date), 'd MMMM', { locale: ru })}
                  </Button>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div style={softPanelStyle}>
            <Text style={{ color: 'var(--app-text-soft)' }}>
              Выбранная дата: {format(new Date(selectedDate), 'd MMMM yyyy', { locale: ru })}
            </Text>
          </div>

          {loadingSlots ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Spinner size="m" />
            </div>
          ) : timeSlots.filter((slot) => slot.isAvailable).length === 0 ? (
            <Placeholder
              header="Нет свободных слотов"
              description={
                timeSlots.length === 0
                  ? 'У мастера выходной в этот день'
                  : 'На эту дату всё время уже занято или прошло'
              }
            />
          ) : (
            <>
              <Text style={{ color: 'var(--app-text-soft)' }}>Выберите время:</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    mode={slot.isAvailable ? 'filled' : 'outline'}
                    size="s"
                    onClick={() => slot.isAvailable && onSelect(selectedDate, slot.time)}
                    disabled={!slot.isAvailable}
                    style={{
                      opacity: slot.isAvailable ? 1 : 0.55,
                      backgroundColor: slot.isAvailable
                        ? 'var(--app-surface)'
                        : 'var(--app-surface-muted)',
                      color: slot.isAvailable ? 'var(--app-text)' : 'var(--app-text-soft)',
                      border: '1px solid var(--app-border)',
                      borderRadius: '14px',
                      boxShadow: 'none',
                    }}
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
