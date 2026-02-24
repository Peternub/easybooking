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

  useEffect(() => {
    loadAvailableDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  async function loadAvailableDates() {
    try {
      // Генерируем даты на 14 дней вперед
      const dates: string[] = [];
      const today = startOfDay(new Date());

      for (let i = 0; i < 14; i++) {
        const date = addDays(today, i);
        dates.push(format(date, 'yyyy-MM-dd'));
      }

      setAvailableDates(dates);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки дат:', err);
      setLoading(false);
    }
  }

  async function loadAvailableSlots(date: string) {
    setLoadingSlots(true);
    try {
      // Генерируем все возможные слоты с 10:00 до 18:00 каждый час
      const allSlots: string[] = [];
      for (let hour = 10; hour < 18; hour++) {
        allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
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
                  backgroundColor: '#6C757D',
                  color: '#FFFFFF',
                  border: 'none',
                }}
              >
                {format(new Date(date), 'd MMMM', { locale: ru })}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <>
          <Button
            mode="plain"
            onClick={() => {
              setSelectedDate(null);
              setTimeSlots([]);
            }}
            style={{ marginBottom: '16px' }}
          >
            ← Изменить дату
          </Button>

          <Text style={{ marginBottom: '16px' }}>
            Дата: {format(new Date(selectedDate), 'd MMMM yyyy', { locale: ru })}
          </Text>

          {loadingSlots ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <Spinner size="m" />
            </div>
          ) : timeSlots.filter((slot) => slot.isAvailable).length === 0 ? (
            <Placeholder
              header="Нет свободных слотов"
              description="На эту дату все время занято или прошло"
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
                      backgroundColor: slot.isAvailable ? '#6C757D' : '#E5E5EA',
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
