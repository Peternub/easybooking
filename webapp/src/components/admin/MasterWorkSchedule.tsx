import { Button, Card, Input, Section, Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import type { Master } from '../../../../shared/types';
import { supabase } from '../../services/supabase';

interface Props {
  master: Master;
}

const DAYS = [
  { key: 'monday', label: 'Понедельник' },
  { key: 'tuesday', label: 'Вторник' },
  { key: 'wednesday', label: 'Среда' },
  { key: 'thursday', label: 'Четверг' },
  { key: 'friday', label: 'Пятница' },
  { key: 'saturday', label: 'Суббота' },
  { key: 'sunday', label: 'Воскресенье' },
];

export function MasterWorkSchedule({ master }: Props) {
  const [schedule, setSchedule] = useState<Record<string, string>>(
    Object.entries(master.work_schedule || {}).reduce((acc, [day, times]) => {
      acc[day] = Array.isArray(times) && times.length > 0 ? times[0] : '';
      return acc;
    }, {} as Record<string, string>)
  );
  const [saving, setSaving] = useState(false);

  function handleTimeChange(day: string, value: string) {
    setSchedule({
      ...schedule,
      [day]: value,
    });
  }

  async function handleSave() {
    setSaving(true);

    try {
      // Преобразуем обратно в формат массива для совместимости
      const scheduleArray = Object.entries(schedule).reduce((acc, [day, time]) => {
        if (time.trim()) {
          acc[day] = [time];
        }
        return acc;
      }, {} as Record<string, string[]>);

      const { error } = await supabase
        .from('masters')
        .update({ work_schedule: scheduleArray })
        .eq('id', master.id);

      if (error) throw error;

      alert('График работы сохранен');
    } catch (error) {
      console.error('Ошибка сохранения графика:', error);
      alert('Не удалось сохранить график');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Section header="График работы">
        <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '16px' }}>
          Укажите рабочие часы для каждого дня недели. Формат: 10:00-18:00
        </Text>

        {DAYS.map((day) => (
          <Card key={day.key} style={{ padding: '16px', marginBottom: '12px' }}>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              {day.label}
            </Text>

            <Input
              type="text"
              value={schedule[day.key] || ''}
              onChange={(e) => handleTimeChange(day.key, e.target.value)}
              placeholder="10:00-18:00"
            />

            {(!schedule[day.key] || !schedule[day.key].trim()) && (
              <Text style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>Выходной</Text>
            )}
          </Card>
        ))}
      </Section>

      <Button size="l" stretched onClick={handleSave} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить график'}
      </Button>
    </div>
  );
}
