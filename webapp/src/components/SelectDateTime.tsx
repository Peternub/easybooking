import { Button, Placeholder, Spinner, Text, Title } from '@telegram-apps/telegram-ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { getAvailableDatesApi, getAvailableSlotsApi } from '../services/api';
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

  useEffect(() => {
    loadAvailableDates();
  }, [masterId]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, masterId]);

  async function loadAvailableDates() {
    setLoading(true);

    try {
      const dates = await getAvailableDatesApi(masterId);
      setAvailableDates(dates);
    } catch (err) {
      console.error('Ошибка загрузки дат:', err);
      setAvailableDates([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableSlots(date: string) {
    setLoadingSlots(true);

    try {
      const slots = await getAvailableSlotsApi(masterId, date);
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
