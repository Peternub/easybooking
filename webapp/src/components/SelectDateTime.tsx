import { Button, Placeholder, Spinner, Text, Title } from '@telegram-apps/telegram-ui';
import { addDays, format, isPast, parse, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: masterId нужен для перезагрузки при смене мастера
  useEffect(() => {
    loadAvailableDates();
  }, [masterId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedDate и masterId нужны для перезагрузки
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, masterId]);

  async function loadAvailableDates() {
    try {
      // Генерируем даты на 14 дней вперед
      const dates: string[] = [];
      const today = startOfDay(new Date());

      for (let i = 0; i < 14; i++) {
        const date = addDays(today, i);
        dates.push(format(date, 'yyyy-MM-dd'));
      }

      // Получаем отпуска мастера
      const { data: absences, error } = await supabase
        .from('master_absences')
        .select('start_date, end_date')
        .eq('master_id', masterId);

      if (error) {
        console.error('Ошибка загрузки отпусков:', error);
      }

      // Фильтруем даты, исключая те, что попадают в отпуск
      const availableDatesFiltered = dates.filter((date) => {
        if (!absences) return true;

        return !absences.some((absence) => {
          const checkDate = new Date(date);
          const startDate = new Date(absence.start_date);
          const endDate = new Date(absence.end_date);
          return checkDate >= startDate && checkDate <= endDate;
        });
      });

      setAvailableDates(availableDatesFiltered);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки дат:', err);
      setLoading(false);
    }
  }

  async function loadAvailableSlots(date: string) {
    setLoadingSlots(true);
    try {
      // Получаем информацию о мастере и его графике работы
      const { data: master, error: masterError } = await supabase
        .from('masters')
        .select('work_schedule')
        .eq('id', masterId)
        .single();

      if (masterError) {
        console.error('Ошибка загрузки мастера:', masterError);
        setTimeSlots([]);
        setLoadingSlots(false);
        return;
      }

      // Определяем день недели (0 = воскресенье, 1 = понедельник, ...)
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

      // Получаем расписание для этого дня
      const workSchedule = master?.work_schedule || {};
      const daySchedule = workSchedule[dayName] || [];

      // Если нет расписания на этот день - выходной
      if (daySchedule.length === 0) {
        setTimeSlots([]);
        setLoadingSlots(false);
        return;
      }

      // Генерируем слоты на основе графика работы
      const allSlots: string[] = [];

      for (const timeRange of daySchedule) {
        // Парсим время вида "10:00-18:00"
        const [startTime, endTime] = timeRange.split('-');
        if (!startTime || !endTime) continue;

        const [startHour] = startTime.split(':').map(Number);
        const [endHour] = endTime.split(':').map(Number);

        // Генерируем слоты каждый час
        for (let hour = startHour; hour < endHour; hour++) {
          allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
      }

      // Получаем занятые слоты из базы данных
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('booking_time')
        .eq('master_id', masterId)
        .eq('booking_date', date)
        .in('status', ['active', 'completed']);

      if (error) {
        console.error('Ошибка загрузки записей:', error);
      }

      const bookedTimes = new Set(bookings?.map((b) => b.booking_time.substring(0, 5)) || []);

      // Проверяем каждый слот
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
    <div>
      <Button mode="plain" onClick={onBack} style={{ marginBottom: '16px' }}>
        ← Назад
      </Button>

      <Title level="1" style={{ marginBottom: '16px' }}>
        Выберите дату и время
      </Title>

      {!selectedDate ? (
        <>
          {availableDates.length === 0 ? (
            <Placeholder
              header="Мастер недоступен"
              description="К сожалению, мастер находится в отпуске или на больничном в ближайшие 14 дней"
            />
          ) : (
            <>
              <Text style={{ marginBottom: '16px' }}>Выберите дату:</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {availableDates.map((date) => (
                  <Button
                    key={date}
                    mode="filled"
                    size="m"
                    onClick={() => setSelectedDate(date)}
                    style={{
                      padding: '12px',
                      backgroundColor: '#1C2833',
                      color: '#FFFFFF',
                      border: 'none',
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
                  : 'На эту дату все время занято или прошло'
              }
            />
          ) : (
            <>
              <Text style={{ marginBottom: '16px' }}>Выберите время:</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    mode={slot.isAvailable ? 'filled' : 'outline'}
                    size="s"
                    onClick={() => slot.isAvailable && onSelect(selectedDate, slot.time)}
                    disabled={!slot.isAvailable}
                    style={{
                      opacity: slot.isAvailable ? 1 : 0.4,
                      cursor: slot.isAvailable ? 'pointer' : 'not-allowed',
                      backgroundColor: slot.isAvailable ? '#1C2833' : '#E5E5EA',
                      color: slot.isAvailable ? '#FFFFFF' : '#8E8E93',
                      border: 'none',
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
