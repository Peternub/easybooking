import { Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import type { Master } from '../../../../shared/types';
import { inputStyle } from '../../components/AppTheme';
import { supabase } from '../../services/supabase';
import { AdminCard, AdminPrimaryButton } from './AdminTheme';

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
    Object.entries(master.work_schedule || {}).reduce(
      (acc, [day, times]) => {
        acc[day] = Array.isArray(times) && times.length > 0 ? times[0] : '';
        return acc;
      },
      {} as Record<string, string>,
    ),
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
      const scheduleArray = Object.entries(schedule).reduce(
        (acc, [day, time]) => {
          if (time.trim()) {
            acc[day] = [time];
          }
          return acc;
        },
        {} as Record<string, string[]>,
      );

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <AdminCard style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Text style={{ fontSize: '32px', fontWeight: 700, color: 'var(--app-text)' }}>
            График работы
          </Text>
          <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)', lineHeight: 1.45 }}>
            Укажите рабочие часы для каждого дня недели. Формат: `10:00-18:00`.
          </Text>
        </div>
      </AdminCard>

      {DAYS.map((day) => (
        <AdminCard key={day.key} style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text style={{ fontSize: '17px', fontWeight: 700, color: 'var(--app-text)' }}>
              {day.label}
            </Text>
            <input
              type="text"
              value={schedule[day.key] || ''}
              onChange={(e) => handleTimeChange(day.key, e.target.value)}
              placeholder="10:00-18:00"
              style={inputStyle}
            />
            {(!schedule[day.key] || !schedule[day.key].trim()) && (
              <Text style={{ fontSize: '12px', color: 'var(--app-text-soft)' }}>Выходной</Text>
            )}
          </div>
        </AdminCard>
      ))}

      <AdminPrimaryButton stretched onClick={handleSave} disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить график'}
      </AdminPrimaryButton>
    </div>
  );
}
