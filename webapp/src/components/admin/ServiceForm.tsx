import { Button, Input, Section, Textarea } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import type { Service } from '../../../../shared/types';
import { supabase } from '../../services/supabase';

interface Props {
  service: Service | null;
  onClose: () => void;
}

export function ServiceForm({ service, onClose }: Props) {
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [price, setPrice] = useState(service?.price?.toString() || '');
  const [durationMinutes, setDurationMinutes] = useState(
    service?.duration_minutes?.toString() || '',
  );
  const [category, setCategory] = useState(service?.category || '');
  const [isActive, setIsActive] = useState(service?.is_active ?? true);
  const [saving, setSaving] = useState(false);

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

    if (!durationMinutes || Number.parseInt(durationMinutes) <= 0) {
      alert('Введите корректную длительность');
      return;
    }

    setSaving(true);

    try {
      const serviceData = {
        name: name.trim(),
        description: description.trim() || null,
        price: Number.parseFloat(price),
        duration_minutes: Number.parseInt(durationMinutes),
        category: category.trim() || null,
        is_active: isActive,
      };

      if (service) {
        // Обновление существующей услуги
        const { error } = await supabase.from('services').update(serviceData).eq('id', service.id);

        if (error) throw error;

        alert('Услуга обновлена');
      } else {
        // Создание новой услуги
        const { error } = await supabase.from('services').insert(serviceData);

        if (error) throw error;

        alert('Услуга создана');
      }

      onClose();
    } catch (error) {
      console.error('Ошибка сохранения услуги:', error);
      alert('Не удалось сохранить услугу');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Button mode="plain" onClick={onClose} style={{ marginBottom: '16px' }}>
        ← Назад к списку
      </Button>

      <Section header={service ? 'Редактировать услугу' : 'Новая услуга'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="service-name"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            >
              Название услуги *
            </label>
            <Input
              id="service-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Стрижка мужская"
              required
            />
          </div>

          <div>
            <label
              htmlFor="service-description"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            >
              Описание
            </label>
            <Textarea
              id="service-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание услуги"
              rows={3}
            />
          </div>

          <div>
            <label
              htmlFor="service-price"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            >
              Цена (₽) *
            </label>
            <Input
              id="service-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1000"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label
              htmlFor="service-duration"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            >
              Длительность (минут) *
            </label>
            <Input
              id="service-duration"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="60"
              min="1"
              step="1"
              required
            />
          </div>

          <div>
            <label
              htmlFor="service-category"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            >
              Категория
            </label>
            <Input
              id="service-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Например: Стрижки"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            <label htmlFor="is_active" style={{ fontSize: '14px' }}>
              Услуга активна (доступна для записи)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button type="submit" mode="filled" size="l" stretched disabled={saving}>
              {saving ? 'Сохранение...' : service ? 'Сохранить изменения' : 'Создать услугу'}
            </Button>
          </div>
        </div>
      </Section>
    </form>
  );
}
