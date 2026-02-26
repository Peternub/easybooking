import { Button, Card, Section, Text } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import type { Master } from '../../../../shared/types';
import { supabase } from '../../services/supabase';
import { MasterAbsences } from './MasterAbsences';
import { MasterServices } from './MasterServices';
import { MasterWorkSchedule } from './MasterWorkSchedule';

interface Props {
  master: Master | null;
  onClose: () => void;
}

export function MasterForm({ master, onClose }: Props) {
  const [name, setName] = useState(master?.name || '');
  const [description, setDescription] = useState(master?.description || '');
  const [specialization, setSpecialization] = useState(master?.specialization || '');
  const [phone, setPhone] = useState(master?.phone || '');
  const [photoUrl, setPhotoUrl] = useState(master?.photo_url || '');
  const [isActive, setIsActive] = useState(master?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'schedule' | 'services' | 'absences'>('info');

  async function handleSave() {
    if (!name.trim()) {
      alert('Введите имя мастера');
      return;
    }

    setSaving(true);

    try {
      const masterData = {
        name: name.trim(),
        description: description.trim() || null,
        specialization: specialization.trim() || null,
        phone: phone.trim() || null,
        photo_url: photoUrl.trim() || null,
        is_active: isActive,
      };

      if (master) {
        // Обновление
        const { error } = await supabase.from('masters').update(masterData).eq('id', master.id);

        if (error) throw error;
        alert('Мастер обновлен');
      } else {
        // Создание
        const { error } = await supabase.from('masters').insert(masterData);

        if (error) throw error;
        alert('Мастер добавлен');
      }

      onClose();
    } catch (error) {
      console.error('Ошибка сохранения мастера:', error);
      alert('Не удалось сохранить мастера');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Button mode="plain" onClick={onClose} style={{ marginBottom: '16px' }}>
        ← Назад к списку
      </Button>

      {/* Табы */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
        <Button
          mode={activeTab === 'info' ? 'filled' : 'outline'}
          size="s"
          onClick={() => setActiveTab('info')}
        >
          Информация
        </Button>
        {master && (
          <>
            <Button
              mode={activeTab === 'schedule' ? 'filled' : 'outline'}
              size="s"
              onClick={() => setActiveTab('schedule')}
            >
              График
            </Button>
            <Button
              mode={activeTab === 'services' ? 'filled' : 'outline'}
              size="s"
              onClick={() => setActiveTab('services')}
            >
              Услуги
            </Button>
            <Button
              mode={activeTab === 'absences' ? 'filled' : 'outline'}
              size="s"
              onClick={() => setActiveTab('absences')}
            >
              Отпуска
            </Button>
          </>
        )}
      </div>

      {/* Основная информация */}
      {activeTab === 'info' && (
        <div>
          <Section header="Основная информация">
            <Card style={{ padding: '16px', marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>
                Имя мастера *
              </Text>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Анна Иванова"
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
                Специализация
              </Text>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Парикмахер-стилист"
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
              <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>Описание</Text>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опытный мастер с 5-летним стажем работы"
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

            <Card style={{ padding: '16px', marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>Телефон</Text>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
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
              <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>URL фото</Text>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
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
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
                <Text>Мастер активен (доступен для записи)</Text>
              </label>
            </Card>
          </Section>

          <Button size="l" stretched onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : master ? 'Сохранить изменения' : 'Добавить мастера'}
          </Button>
        </div>
      )}

      {/* График работы */}
      {activeTab === 'schedule' && master && <MasterWorkSchedule master={master} />}

      {/* Услуги */}
      {activeTab === 'services' && master && <MasterServices master={master} />}

      {/* Отпуска/больничные */}
      {activeTab === 'absences' && master && <MasterAbsences master={master} />}
    </div>
  );
}
