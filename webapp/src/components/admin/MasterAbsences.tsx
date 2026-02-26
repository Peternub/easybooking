import { Button, Card, Section, Spinner, Text } from '@telegram-apps/telegram-ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { Master, MasterAbsence } from '../../../../shared/types';
import { supabase } from '../../services/supabase';

interface Props {
  master: Master;
}

export function MasterAbsences({ master }: Props) {
  const [absences, setAbsences] = useState<MasterAbsence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState<'vacation' | 'sick_leave' | 'other'>('vacation');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: master.id нужен для перезагрузки
  useEffect(() => {
    loadAbsences();
  }, [master.id]);

  async function loadAbsences() {
    try {
      const { data, error } = await supabase
        .from('master_absences')
        .select('*')
        .eq('master_id', master.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setAbsences(data || []);
    } catch (error) {
      console.error('Ошибка загрузки отпусков:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!startDate || !endDate) {
      alert('Укажите даты начала и окончания');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      alert('Дата окончания должна быть позже даты начала');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from('master_absences').insert({
        master_id: master.id,
        start_date: startDate,
        end_date: endDate,
        reason,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      alert('Отпуск/больничный добавлен');
      setShowForm(false);
      setStartDate('');
      setEndDate('');
      setNotes('');
      loadAbsences();
    } catch (error) {
      console.error('Ошибка добавления отпуска:', error);
      alert('Не удалось добавить отпуск');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(absenceId: string) {
    if (!confirm('Удалить этот отпуск/больничный?')) {
      return;
    }

    try {
      const { error } = await supabase.from('master_absences').delete().eq('id', absenceId);

      if (error) throw error;

      alert('Удалено');
      loadAbsences();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить');
    }
  }

  const getReasonText = (r: string) => {
    switch (r) {
      case 'vacation':
        return '🏖️ Отпуск';
      case 'sick_leave':
        return '🏥 Больничный';
      case 'other':
        return '📝 Другое';
      default:
        return r;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  return (
    <div>
      {!showForm ? (
        <>
          <Button
            size="l"
            stretched
            onClick={() => setShowForm(true)}
            style={{ marginBottom: '16px' }}
          >
            + Добавить отпуск/больничный
          </Button>

          <Section header="Отпуска и больничные">
            {absences.length === 0 ? (
              <Text style={{ opacity: 0.6, textAlign: 'center', padding: '20px' }}>
                Нет записей
              </Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {absences.map((absence) => (
                  <Card key={absence.id} style={{ padding: '12px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {getReasonText(absence.reason)}
                      </Text>
                    </div>
                    <Text style={{ fontSize: '14px', opacity: 0.8 }}>
                      {format(new Date(absence.start_date), 'd MMMM yyyy', { locale: ru })} -{' '}
                      {format(new Date(absence.end_date), 'd MMMM yyyy', { locale: ru })}
                    </Text>
                    {absence.notes && (
                      <Text style={{ fontSize: '14px', opacity: 0.6, marginTop: '4px' }}>
                        {absence.notes}
                      </Text>
                    )}
                    <Button
                      mode="outline"
                      size="s"
                      onClick={() => handleDelete(absence.id)}
                      style={{ marginTop: '8px', color: '#F44336' }}
                    >
                      Удалить
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </>
      ) : (
        <div>
          <Button mode="plain" onClick={() => setShowForm(false)} style={{ marginBottom: '16px' }}>
            ← Назад
          </Button>

          <Section header="Добавить отпуск/больничный">
            <Card style={{ padding: '16px', marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>Причина</Text>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as typeof reason)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid var(--tgui--divider_color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--tgui--secondary_bg_color)',
                  color: 'var(--tgui--text_color)',
                  outline: 'none',
                }}
              >
                <option value="vacation">Отпуск</option>
                <option value="sick_leave">Больничный</option>
                <option value="other">Другое</option>
              </select>
            </Card>

            <Card style={{ padding: '16px', marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>
                Дата начала
              </Text>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid var(--tgui--divider_color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--tgui--secondary_bg_color)',
                  color: 'var(--tgui--text_color)',
                  outline: 'none',
                }}
              />
            </Card>

            <Card style={{ padding: '16px', marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>
                Дата окончания
              </Text>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid var(--tgui--divider_color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--tgui--secondary_bg_color)',
                  color: 'var(--tgui--text_color)',
                  outline: 'none',
                }}
              />
            </Card>

            <Card style={{ padding: '16px', marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>
                Заметки (необязательно)
              </Text>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Дополнительная информация"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid var(--tgui--divider_color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--tgui--secondary_bg_color)',
                  color: 'var(--tgui--text_color)',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </Card>

            <Button size="l" stretched onClick={handleAdd} disabled={saving}>
              {saving ? 'Добавление...' : 'Добавить'}
            </Button>
          </Section>
        </div>
      )}
    </div>
  );
}
