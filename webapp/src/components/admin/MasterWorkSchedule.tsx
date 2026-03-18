import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Master } from '../../../../shared/types';
import { inputStyle } from '../../components/AppTheme';
import { getMasterWorkScheduleApi, updateMasterWorkScheduleApi } from '../../services/api';
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
] as const;

export function MasterWorkSchedule({ master }: Props) {
  const [schedule, setSchedule] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [master.id]);

  async function loadSchedule() {
    setLoading(true);
    setSaved(false);

    try {
      const workSchedule = await getMasterWorkScheduleApi(master.id);
      const nextSchedule = DAYS.reduce(
        (acc, day) => {
          const times = workSchedule?.[day.key];
          acc[day.key] = Array.isArray(times) && times.length > 0 ? times[0] : '';
          return acc;
        },
        {} as Record<string, string>,
      );

      setSchedule(nextSchedule);
    } catch (error) {
      console.error('Ошибка загрузки графика:', error);
      alert('Не удалось загрузить график');
    } finally {
      setLoading(false);
    }
  }

  function handleTimeChange(day: string, value: string) {
    setSaved(false);
    setSchedule((prev) => ({
      ...prev,
      [day]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const schedulePayload = Object.entries(schedule).reduce(
        (acc, [day, time]) => {
          if (time.trim()) {
            acc[day as keyof Master['work_schedule']] = [time.trim()];
          }
          return acc;
        },
        {} as Master['work_schedule'],
      );

      await updateMasterWorkScheduleApi(master.id, schedulePayload);
      setSaved(true);
    } catch (error) {
      console.error('Ошибка сохранения графика:', error);
      alert('Не удалось сохранить график');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AdminCard style={{ padding: '16px' }}>
          <Text style={{ fontSize: '16px', color: 'var(--app-text-soft)' }}>Загрузка графика...</Text>
        </AdminCard>
      </div>
    );
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
        {saving ? 'Сохранение...' : saved ? 'Сохранено' : 'Сохранить график'}
      </AdminPrimaryButton>
    </div>
  );
}
