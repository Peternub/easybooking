import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Service } from '../../../../shared/types';
import { backButtonStyle, inputStyle } from '../../components/AppTheme';
import { supabase } from '../../services/supabase';
import { AdminCard, AdminPrimaryButton } from './AdminTheme';

interface Props {
  service: Service | null;
  onClose: () => void;
}

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  color: 'var(--app-text)',
} as const;

export function ServiceForm({ service, onClose }: Props) {
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [price, setPrice] = useState(service?.price?.toString() || '');
  const [category, setCategory] = useState(service?.category || '');
  const [isActive, setIsActive] = useState(service?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(service?.name || '');
    setDescription(service?.description || '');
    setPrice(service?.price?.toString() || '');
    setCategory(service?.category || '');
    setIsActive(service?.is_active ?? true);
    setSaving(false);
    setSaved(false);
  }, [service]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      alert('Введите название услуги');
      return;
    }

    if (!price || Number.parseFloat(price) <= 0) {
      alert('Введите корректную цену');
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      const serviceData = {
        name: name.trim(),
        description: description.trim() || null,
        price: Number.parseFloat(price),
        duration_minutes: 60,
        category: category.trim() || null,
        is_active: isActive,
      };

      if (service) {
        const { error } = await supabase.from('services').update(serviceData).eq('id', service.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert(serviceData);
        if (error) throw error;
      }

      setSaved(true);
    } catch (error) {
      console.error('Ошибка сохранения услуги:', error);
      alert('Не удалось сохранить услугу');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

      <AdminCard style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Text style={{ fontSize: '28px', fontWeight: 700, color: 'var(--app-text)' }}>
            {service ? 'Редактировать услугу' : 'Новая услуга'}
          </Text>

          <div>
            <label htmlFor="service-name" style={labelStyle}>
              Название услуги *
            </label>
            <input
              id="service-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              placeholder="Например: Стрижка мужская"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label htmlFor="service-description" style={labelStyle}>
              Описание
            </label>
            <textarea
              id="service-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setSaved(false);
              }}
              placeholder="Краткое описание услуги"
              rows={3}
              style={{ ...inputStyle, minHeight: '108px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label htmlFor="service-price" style={labelStyle}>
              Цена (₽) *
            </label>
            <input
              id="service-price"
              type="number"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setSaved(false);
              }}
              placeholder="1000"
              min="0"
              step="0.01"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label htmlFor="service-category" style={labelStyle}>
              Категория
            </label>
            <input
              id="service-category"
              type="text"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSaved(false);
              }}
              placeholder="Например: Стрижки"
              style={inputStyle}
            />
          </div>

          <label
            htmlFor="service-active"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--app-text)' }}
          >
            <input
              id="service-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => {
                setIsActive(e.target.checked);
                setSaved(false);
              }}
              style={{ width: '18px', height: '18px', accentColor: 'var(--app-accent)' }}
            />
            Услуга активна (доступна для записи)
          </label>
        </div>
      </AdminCard>

      <AdminPrimaryButton type="submit" stretched disabled={saving}>
        {saving
          ? 'Сохранение...'
          : saved
            ? 'Сохранено'
            : service
              ? 'Сохранить изменения'
              : 'Создать услугу'}
      </AdminPrimaryButton>
    </form>
  );
}
