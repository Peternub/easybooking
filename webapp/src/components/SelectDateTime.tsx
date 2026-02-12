import { useState, useEffect } from 'react';
import { Button, Title, Text, Spinner, Placeholder } from '@telegram-apps/telegram-ui';
import { supabase } from '../services/supabase';
import { format, addDays, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props {
  masterId: string;
  onSelect: (date: string, time: string) => void;
  onBack: () => void;
}

export function SelectDateTime({ masterId, onSelect, onBack }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailableDates();
  }, [masterId]);

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
    try {
      // Здесь должна быть логика получения свободных слотов
      // Для примера генерируем слоты с 10:00 до 18:00 каждые 30 минут
      const slots: string[] = [];
      for (let hour = 10; hour < 18; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }

      setAvailableSlots(slots);
    } catch (err) {
      console.error('Ошибка загрузки слотов:', err);
      setAvailableSlots([]);
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
                mode="outline"
                size="m"
                onClick={() => setSelectedDate(date)}
                style={{ padding: '12px' }}
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
              setAvailableSlots([]);
            }}
            style={{ marginBottom: '16px' }}
          >
            ← Изменить дату
          </Button>

          <Text style={{ marginBottom: '16px' }}>
            Дата: {format(new Date(selectedDate), 'd MMMM yyyy', { locale: ru })}
          </Text>

          {availableSlots.length === 0 ? (
            <Placeholder
              header="Нет свободных слотов"
              description="На эту дату все время занято"
            />
          ) : (
            <>
              <Text style={{ marginBottom: '16px' }}>Выберите время:</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {availableSlots.map((time) => (
                  <Button
                    key={time}
                    mode="outline"
                    size="s"
                    onClick={() => onSelect(selectedDate, time)}
                  >
                    {time}
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
