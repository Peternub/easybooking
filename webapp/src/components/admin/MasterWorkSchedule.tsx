import { Button, Card, Input, Section, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Master, MasterSchedule } from '../../../../shared/types';
import { supabase } from '../../services/supabase';

interface Props {
  master: Master;
}

const DAYS = [
  { key: 1, label: 'Понедельник' },
  { key: 2, label: 'Вторник' },
  { key: 3, label: 'Среда' },
  { key: 4, label: 'Четверг' },
  { key: 5, label: 'Пятница' },
  { key: 6, label: 'Суббота' },
  { key: 0, label: 'Воскресенье' },
];

export function MasterWorkSchedule({ master }: Props) {
  const [schedules, setSchedules] = useState<MasterSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: master.id нужен для перезагрузки
  useEffect(() => {
    loadSchedules();
  }, [master.id]);

  async function loadSchedules() {
    try {
      const { data, error } = await supabase
        .from('master_work_schedule')
        .select('*')
        .eq('master_id', master.id)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;

      setSchedules(data || []);
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
      alert('Не удалось загрузить расписание');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSlot(dayOfWeek: number) {
    try {
      const { error } = await supabase.from('master_work_schedule').insert({
        master_id: master.id,
        day_of_week: dayOfWeek,
        start_time: '10:00:00',
        end_time: '18:00:00',
      });

      if (error) throw error;

      loadSchedules();
    } catch (error) {
      console.error('Ошибка добавления слота:', error);
      alert('Не удалось добавить слот');
    }
  }

  async function handleUpdateSlot(
    scheduleId: string,
    field: 'start_time' | 'end_time',
    value: string,
  ) {
    try {
      // Добавляем секунды если их нет
      const timeValue =
        value.includes(':') && value.split(':').length === 2 ? `${value}:00` : value;

      const { error } = await supabase
        .from('master_work_schedule')
        .update({ [field]: timeValue })
        .eq('id', scheduleId);

      if (error) throw error;

      loadSchedules();
    } catch (error) {
      console.error('Ошибка обновления слота:', error);
      alert('Не удалось обновить слот');
    }
  }

  async function handleRemoveSlot(scheduleId: string) {
    if (!confirm('Удалить этот временной слот?')) {
      return;
    }

    try {
      const { error } = await supabase.from('master_work_schedule').delete().eq('id', scheduleId);

      if (error) throw error;

      loadSchedules();
    } catch (error) {
      console.error('Ошибка удаления слота:', error);
      alert('Не удалось удалить слот');
    }
  }

  function getSchedulesForDay(dayOfWeek: number): MasterSchedule[] {
    return schedules.filter((s) => s.day_of_week === dayOfWeek);
  }

  function formatTime(time: string): string {
    // Преобразуем "10:00:00" в "10:00"
    return time.substring(0, 5);
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
      <Section header="График работы">
        <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '16px' }}>
          Укажите рабочие часы для каждого дня недели
        </Text>

        {DAYS.map((day) => {
          const daySchedules = getSchedulesForDay(day.key);

          return (
            <Card key={day.key} style={{ padding: '16px', marginBottom: '12px' }}>
              <Text style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                {day.label}
              </Text>

              {daySchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '8px',
                    alignItems: 'center',
                  }}
                >
                  <Input
                    type="time"
                    value={formatTime(schedule.start_time)}
                    onChange={(e) => handleUpdateSlot(schedule.id, 'start_time', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Text style={{ fontSize: '14px' }}>—</Text>
                  <Input
                    type="time"
                    value={formatTime(schedule.end_time)}
                    onChange={(e) => handleUpdateSlot(schedule.id, 'end_time', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    mode="outline"
                    size="s"
                    onClick={() => handleRemoveSlot(schedule.id)}
                    style={{ color: '#F44336' }}
                  >
                    ✕
                  </Button>
                </div>
              ))}

              <Button mode="outline" size="s" onClick={() => handleAddSlot(day.key)}>
                + Добавить время
              </Button>

              {daySchedules.length === 0 && (
                <Text style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>Выходной</Text>
              )}
            </Card>
          );
        })}
      </Section>
    </div>
  );
}
