import { Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Service } from '../../../../shared/types';
import { getAdminServicesApi, toggleServiceActiveApi } from '../../services/api';
import {
  AdminCard,
  AdminChip,
  AdminDetailRow,
  AdminEmptyState,
  AdminPrimaryButton,
} from './AdminTheme';
import { ServiceForm } from './ServiceForm';

export function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const data = await getAdminServicesApi();
      setServices(data);
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
      alert('Не удалось загрузить услуги');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(service: Service) {
    try {
      await toggleServiceActiveApi(service.id, !service.is_active);
      alert(service.is_active ? 'Услуга деактивирована' : 'Услуга активирована');
      loadServices();
    } catch (error) {
      console.error('Ошибка изменения статуса услуги:', error);
      alert('Не удалось изменить статус услуги');
    }
  }

  function handleDelete() {
    alert('Удаление услуги сделаем отдельным шагом после настройки новой схемы базы');
  }

  function handleEdit(service: Service) {
    setEditingService(service);
    setShowForm(true);
  }

  function handleAdd() {
    setEditingService(null);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingService(null);
    loadServices();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (showForm) {
    return <ServiceForm service={editingService} onClose={handleFormClose} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <AdminPrimaryButton stretched onClick={handleAdd}>
        + Добавить услугу
      </AdminPrimaryButton>

      {services.length === 0 ? (
        <AdminEmptyState text="Услуги еще не добавлены." />
      ) : (
        services.map((service) => (
          <AdminCard key={service.id}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: 'var(--app-text)',
                  }}
                >
                  {service.name}
                </Text>
                <AdminChip
                  label={service.is_active ? 'Активна' : 'Скрыта'}
                  tone={service.is_active ? 'green' : 'orange'}
                />
                {service.category && <AdminChip label={service.category} tone="blue" />}
              </div>

              {service.description && (
                <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)', lineHeight: 1.5 }}>
                  {service.description}
                </Text>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '14px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--app-surface-muted)',
                }}
              >
                <AdminDetailRow label="Цена" value={`${service.price} ₽`} />
                {!service.description && !service.category && (
                  <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>
                    Описание и категория пока не заполнены.
                  </Text>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button mode="outline" size="s" onClick={() => handleEdit(service)}>
                  Изменить
                </Button>
                <Button
                  mode="outline"
                  size="s"
                  onClick={() => handleToggleActive(service)}
                  style={{ color: 'var(--app-accent-strong)' }}
                >
                  {service.is_active ? 'Деактивировать' : 'Активировать'}
                </Button>
                <Button mode="outline" size="s" onClick={handleDelete} style={{ color: 'var(--app-danger)' }}>
                  Удалить
                </Button>
              </div>
            </div>
          </AdminCard>
        ))
      )}
    </div>
  );
}