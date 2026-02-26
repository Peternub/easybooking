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
  const [schedule, setSchedule] = useState<Record<string, string[]>>(master.work_schedule || {});
  const [saving, setSaving] = useState(false);

  function handleTimeChange(day: string, index: number, value: string) {
    const daySchedule = schedule[day] || [];
    const newDaySchedule = [...daySchedule];
    newDaySchedule[index] = value;

    setSchedule({
      ...schedule,
      [day]: newDaySchedule,
    });
  }

  function handleAddSlot(day: string) {
    const daySchedule = schedule[day] || [];
    setSchedule({
      ...schedule,
      [day]: [...daySchedule, '10:00-18:00'],
    });
  }

  function handleRemoveSlot(day: string, index: number) {
    const daySchedule = schedule[day] || [];
    const newDaySchedule = daySchedule.filter((_, i) => i !== index);

    setSchedule({
      ...schedule,
      [day]: newDaySchedule,
    });
  }

  async function handleSave() {
    setSaving(true);

    try {
      const { error } = await supabase
        .from('masters')
        .update({ work_schedule: schedule })
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

            {(schedule[day.key] || []).map((timeSlot: string, index: number) => (
              <div
                key={`${day.key}-${index}`}
                style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}
              >
                <Input
                  type="text"
                  value={timeSlot}
                  onChange={(e) => handleTimeChange(day.key, index, e.target.value)}
                  placeholder="10:00-18:00"
                  style={{ flex: 1 }}
                />
                <Button
                  mode="outline"
                  size="s"
                  onClick={() => handleRemoveSlot(day.key, index)}
                  style={{ color: '#F44336' }}
                >
                  ✕
                </Button>
              </div>
            ))}

            <Button mode="outline" size="s" onClick={() => handleAddSlot(day.key)}>
              + Добавить время
            </Button>

            {(!schedule[day.key] || schedule[day.key].length === 0) && (
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
