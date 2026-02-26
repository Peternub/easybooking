import { Button, Card, Section, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Service } from '../../../../shared/types';
import { supabase } from '../../services/supabase';
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
      const { data, error } = await supabase.from('services').select('*').order('name');

      if (error) throw error;

      setServices(data || []);
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
      alert('Не удалось загрузить услуги');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(service: Service) {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;

      alert(service.is_active ? 'Услуга деактивирована' : 'Услуга активирована');
      loadServices();
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
      alert('Не удалось изменить статус услуги');
    }
  }

  async function handleDelete(serviceId: string) {
    if (!confirm('Удалить эту услугу? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceId);

      if (error) {
        // Проверяем если ошибка из-за существующих записей
        if (error.code === '23503') {
          alert(
            'Невозможно удалить услугу, так как есть записи клиентов с этой услугой. Вместо удаления рекомендуется деактивировать услугу.',
          );
        } else {
          throw error;
        }
        return;
      }

      alert('Услуга удалена');
      loadServices();
    } catch (error) {
      console.error('Ошибка удаления услуги:', error);
      alert('Не удалось удалить услугу');
    }
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
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Button mode="filled" size="l" stretched onClick={handleAdd}>
          + Добавить услугу
        </Button>
      </div>

      <Section header="Все услуги">
        {services.length === 0 ? (
          <Text style={{ opacity: 0.6, textAlign: 'center', padding: '20px' }}>Нет услуг</Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {services.map((service) => (
              <Card key={service.id} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>{service.name}</Text>
                        {!service.is_active && (
                          <Text style={{ fontSize: '12px', color: '#F44336', marginTop: '4px' }}>
                            (Неактивна)
                          </Text>
                        )}
                      </div>
                    </div>

                    {service.description && (
                      <Text style={{ fontSize: '14px', opacity: 0.7, marginTop: '8px' }}>
                        {service.description}
                      </Text>
                    )}

                    <div style={{ marginTop: '8px', display: 'flex', gap: '16px' }}>
                      <Text style={{ fontSize: '14px' }}>💰 {service.price} ₽</Text>
                      <Text style={{ fontSize: '14px' }}>⏱️ {service.duration_minutes} мин</Text>
                      {service.category && (
                        <Text style={{ fontSize: '14px' }}>📁 {service.category}</Text>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button mode="outline" size="s" onClick={() => handleEdit(service)}>
                      ✏️ Изменить
                    </Button>
                    <Button
                      mode="outline"
                      size="s"
                      onClick={() => handleToggleActive(service)}
                      style={{ color: service.is_active ? '#FF9800' : '#4CAF50' }}
                    >
                      {service.is_active ? '⏸️ Деактивировать' : '▶️ Активировать'}
                    </Button>
                    <Button
                      mode="outline"
                      size="s"
                      onClick={() => handleDelete(service.id)}
                      style={{ color: '#F44336' }}
                    >
                      🗑️ Удалить
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
