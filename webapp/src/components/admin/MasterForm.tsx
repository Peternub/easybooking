import { Button, Card, Input, Section, Text, Textarea } from '@telegram-apps/telegram-ui';
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
  const [phone, setPhone] = useState(master?.phone || '');
  const [photoUrl, setPhotoUrl] = useState(master?.photo_url || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(master?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'schedule' | 'services' | 'absences'>('info');

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    setPhotoFile(file);

    // Показываем превью
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return photoUrl || null;

    setUploading(true);
    try {
      // Генерируем уникальное имя файла
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `masters/${fileName}`;

      // Загружаем файл
      const { error: uploadError } = await supabase.storage
        .from('master-photos')
        .upload(filePath, photoFile);

      if (uploadError) {
        console.error('Ошибка загрузки:', uploadError);
        throw uploadError;
      }

      // Получаем публичный URL
      const { data } = supabase.storage.from('master-photos').getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
      alert('Не удалось загрузить фото');
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      alert('Введите имя мастера');
      return;
    }

    setSaving(true);

    try {
      // Загружаем фото, если выбрано новое
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        const uploadedUrl = await uploadPhoto();
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
        }
      }

      const masterData = {
        name: name.trim(),
        description: description.trim() || null,
        phone: phone.trim() || null,
        photo_url: finalPhotoUrl || null,
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
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Анна Иванова"
              />
            </Card>

            <Card style={{ padding: '16px', marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>Описание</Text>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опытный мастер с 5-летним стажем работы"
                rows={3}
              />
            </Card>

            <Card style={{ padding: '16px', marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>Телефон</Text>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
              />
            </Card>

            <Card style={{ padding: '16px', marginBottom: '12px' }}>
              <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px' }}>
                Фото мастера
              </Text>
              {photoUrl && (
                <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                  <img
                    src={photoUrl}
                    alt="Фото мастера"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--tgui--secondary_bg_color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--tgui--bg_color)',
                  color: 'var(--tgui--text_color)',
                }}
              />
              <Text style={{ fontSize: '12px', opacity: 0.5, marginTop: '8px' }}>
                Максимальный размер: 5MB. Форматы: JPG, PNG, GIF
              </Text>
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

          <Button size="l" stretched onClick={handleSave} disabled={saving || uploading}>
            {uploading
              ? 'Загрузка фото...'
              : saving
                ? 'Сохранение...'
                : master
                  ? 'Сохранить изменения'
                  : 'Добавить мастера'}
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
