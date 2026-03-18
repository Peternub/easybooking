import { Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { AbsenceReason, Master, MasterAbsence } from '../../../../shared/types';
import { inputStyle } from '../../components/AppTheme';
import {
  createMasterAbsenceApi,
  deleteMasterAbsenceApi,
  getMasterAbsencesApi,
} from '../../services/api';
import { AdminCard, AdminPrimaryButton } from './AdminTheme';

interface Props {
  master: Master;
}

export function MasterAbsences({ master }: Props) {
  const [absences, setAbsences] = useState<MasterAbsence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState<AbsenceReason>('vacation');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAbsences();
  }, [master.id]);

  async function loadAbsences() {
    try {
      const data = await getMasterAbsencesApi(master.id);
      setAbsences(data);
    } catch (error) {
      console.error('Ошибка загрузки отпусков:', error);
      alert('Не удалось загрузить отпуска');
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
      await createMasterAbsenceApi(master.id, {
        start_date: startDate,
        end_date: endDate,
        reason,
        notes: notes.trim() || null,
      });

      alert('Отпуск/больничный добавлен');
      setShowForm(false);
      setStartDate('');
      setEndDate('');
      setNotes('');
      setReason('vacation');
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
      await deleteMasterAbsenceApi(master.id, absenceId);
      alert('Удалено');
      loadAbsences();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить');
    }
  }

  const getReasonText = (value: AbsenceReason) => {
    switch (value) {
      case 'vacation':
        return 'Отпуск';
      case 'sick_leave':
        return 'Больничный';
      case 'other':
        return 'Другое';
      default:
        return value;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (!showForm) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AdminPrimaryButton stretched onClick={() => setShowForm(true)}>
          + Добавить отпуск/больничный
        </AdminPrimaryButton>

        <AdminCard style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Text style={{ fontSize: '32px', fontWeight: 700, color: 'var(--app-text)' }}>
              Отпуска и больничные
            </Text>
            <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>
              Периоды недоступности мастера.
            </Text>
          </div>
        </AdminCard>

        {absences.length === 0 ? (
          <AdminCard style={{ padding: '16px', textAlign: 'center' }}>
            <Text style={{ color: 'var(--app-text-soft)' }}>Нет записей</Text>
          </AdminCard>
        ) : (
          absences.map((absence) => (
            <AdminCard key={absence.id} style={{ padding: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text style={{ fontSize: '17px', fontWeight: 700, color: 'var(--app-text)' }}>
                  {getReasonText(absence.reason)}
                </Text>
                <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>
                  {format(new Date(absence.start_date), 'd MMMM yyyy', { locale: ru })} -{' '}
                  {format(new Date(absence.end_date), 'd MMMM yyyy', { locale: ru })}
                </Text>
                {absence.notes && (
                  <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>
                    {absence.notes}
                  </Text>
                )}
                <Button
                  mode="outline"
                  size="s"
                  onClick={() => handleDelete(absence.id)}
                  style={{ color: 'var(--app-danger)', alignSelf: 'flex-start' }}
                >
                  Удалить
                </Button>
              </div>
            </AdminCard>
          ))
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button
        type="button"
        onClick={() => setShowForm(false)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--app-accent-strong)',
          fontSize: '16px',
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        ← Назад
      </button>

      <AdminCard style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Text style={{ fontSize: '30px', fontWeight: 700, color: 'var(--app-text)' }}>
            Добавить отпуск/больничный
          </Text>

          <div>
            <Text style={{ marginBottom: '8px', display: 'block', color: 'var(--app-text)' }}>
              Причина
            </Text>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as AbsenceReason)}
              style={{ ...inputStyle, appearance: 'none' }}
            >
              <option value="vacation">Отпуск</option>
              <option value="sick_leave">Больничный</option>
              <option value="other">Другое</option>
            </select>
          </div>

          <div>
            <Text style={{ marginBottom: '8px', display: 'block', color: 'var(--app-text)' }}>
              Дата начала
            </Text>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <Text style={{ marginBottom: '8px', display: 'block', color: 'var(--app-text)' }}>
              Дата окончания
            </Text>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <Text style={{ marginBottom: '8px', display: 'block', color: 'var(--app-text)' }}>
              Заметки (необязательно)
            </Text>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация"
              rows={3}
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            />
          </div>
        </div>
      </AdminCard>

      <AdminPrimaryButton stretched onClick={handleAdd} disabled={saving}>
        {saving ? 'Добавление...' : 'Добавить'}
      </AdminPrimaryButton>
    </div>
  );
}
