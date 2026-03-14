import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Master } from '../../../../shared/types';
import { backButtonStyle, inputStyle } from '../../components/AppTheme';
import { supabase } from '../../services/supabase';
import { AdminCard, AdminPrimaryButton } from './AdminTheme';
import { MasterAbsences } from './MasterAbsences';
import { MasterServices } from './MasterServices';
import { MasterWorkSchedule } from './MasterWorkSchedule';

interface Props {
  master: Master | null;
  onClose: () => void;
}

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  color: 'var(--app-text)',
} as const;

export function MasterForm({ master, onClose }: Props) {
  const [name, setName] = useState(master?.name || '');
  const [description, setDescription] = useState(master?.description || '');
  const [phone, setPhone] = useState(master?.phone || '');
  const [photoUrl, setPhotoUrl] = useState(master?.photo_url || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(master?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'schedule' | 'services' | 'absences'>('info');

  // Сбрасываем локальные поля при открытии другого мастера.
  useEffect(() => {
    setName(master?.name || '');
    setDescription(master?.description || '');
    setPhone(master?.phone || '');
    setPhotoUrl(master?.photo_url || '');
    setPhotoFile(null);
    setIsActive(master?.is_active ?? true);
    setSaving(false);
    setSaved(false);
    setUploading(false);
    setActiveTab('info');
  }, [master]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    setSaved(false);
    setPhotoFile(file);

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
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `masters/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('master-photos')
        .upload(filePath, photoFile);

      if (uploadError) {
        console.error('Ошибка загрузки:', uploadError);
        throw uploadError;
      }

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

    setSaved(false);
    setSaving(true);

    try {
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
        const { error } = await supabase.from('masters').update(masterData).eq('id', master.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('masters').insert(masterData);
        if (error) throw error;
      }

      setSaved(true);
    } catch (error) {
      console.error('Ошибка сохранения мастера:', error);
      alert('Не удалось сохранить мастера');
    } finally {
      setSaving(false);
    }
  }

  function renderTabButton(key: 'info' | 'schedule' | 'services' | 'absences', label: string) {
    const active = activeTab === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setActiveTab(key)}
        style={{
          border: '1px solid var(--app-border)',
          borderRadius: '999px',
          padding: '10px 14px',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          backgroundColor: active ? 'var(--app-accent)' : 'var(--app-surface)',
          color: active ? '#fffaf3' : 'var(--app-text)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <button
        type="button"
        onClick={onClose}
        style={{
          ...backButtonStyle,
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        ← Назад к списку
      </button>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        {renderTabButton('info', 'Информация')}
        {master && (
          <>
            {renderTabButton('schedule', 'График')}
            {renderTabButton('services', 'Услуги')}
            {renderTabButton('absences', 'Отпуска')}
          </>
        )}
      </div>

      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AdminCard style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Text style={{ fontSize: '28px', fontWeight: 700, color: 'var(--app-text)' }}>
                {master ? 'Редактировать мастера' : 'Новый мастер'}
              </Text>

              <div>
                <label htmlFor="master-name" style={labelStyle}>
                  Имя мастера *
                </label>
                <input
                  id="master-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="Анна Иванова"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="master-description" style={labelStyle}>
                  Описание
                </label>
                <textarea
                  id="master-description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="Опытный мастер с 5-летним стажем работы"
                  rows={3}
                  style={{ ...inputStyle, minHeight: '108px', resize: 'vertical' }}
                />
              </div>

              <div>
                <label htmlFor="master-phone" style={labelStyle}>
                  Телефон
                </label>
                <input
                  id="master-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="+7 (999) 123-45-67"
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="master-photo" style={labelStyle}>
                  Фото мастера
                </label>
                {photoUrl && (
                  <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                    <img
                      src={photoUrl}
                      alt="Фото мастера"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        border: '1px solid var(--app-border)',
                      }}
                    />
                  </div>
                )}
                <input
                  id="master-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ ...inputStyle, padding: '10px 12px' }}
                />
                <Text
                  style={{
                    display: 'block',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--app-text-soft)',
                  }}
                >
                  Максимальный размер: 5MB. Форматы: JPG, PNG, GIF
                </Text>
              </div>

              <label
                htmlFor="master-active"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--app-text)',
                }}
              >
                <input
                  id="master-active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => {
                    setIsActive(e.target.checked);
                    setSaved(false);
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--app-accent)' }}
                />
                Мастер активен (доступен для записи)
              </label>
            </div>
          </AdminCard>

          <AdminPrimaryButton onClick={handleSave} stretched disabled={saving || uploading}>
            {uploading
              ? 'Загрузка фото...'
              : saving
                ? 'Сохранение...'
                : saved
                  ? 'Сохранено'
                  : master
                    ? 'Сохранить изменения'
                    : 'Добавить мастера'}
          </AdminPrimaryButton>
        </div>
      )}

      {activeTab === 'schedule' && master && <MasterWorkSchedule master={master} />}
      {activeTab === 'services' && master && <MasterServices master={master} />}
      {activeTab === 'absences' && master && <MasterAbsences master={master} />}
    </div>
  );
}
