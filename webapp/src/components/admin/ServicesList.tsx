import { Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Service } from '../../../../shared/types';
import { supabase } from '../../services/supabase';
import {
  AdminCard,
  AdminChip,
  AdminDetailRow,
  AdminEmptyState,
  AdminPrimaryButton,
} from './AdminTheme';
import { ServiceForm } from './ServiceForm';

interface RelatedBooking {
  id: string;
  admin_notes: string | null;
}

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

      if (error) {
        throw error;
      }

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

      if (error) {
        throw error;
      }

      alert(service.is_active ? 'Услуга деактивирована' : 'Услуга активирована');
      loadServices();
    } catch (error) {
      console.error('Ошибка изменения статуса услуги:', error);
      alert('Не удалось изменить статус услуги');
    }
  }

  async function handleDelete(serviceId: string) {
    if (
      !confirm('Удалить эту услугу? История записей сохранится, но услуга исчезнет из каталога.')
    ) {
      return;
    }

    try {
      const service = services.find((item) => item.id === serviceId);
      const deletedServiceNote = service?.name
        ? `[Удалена услуга: ${service.name}]`
        : '[Удалена услуга]';

      const { data: relatedBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, admin_notes')
        .eq('service_id', serviceId);

      if (bookingsError) {
        throw bookingsError;
      }

      for (const booking of (relatedBookings || []) as RelatedBooking[]) {
        const nextAdminNotes = booking.admin_notes
          ? `${booking.admin_notes}\n${deletedServiceNote}`
          : deletedServiceNote;

        const { error: bookingUpdateError } = await supabase
          .from('bookings')
          .update({
            service_id: null,
            admin_notes: nextAdminNotes,
          })
          .eq('id', booking.id);

        if (bookingUpdateError) {
          throw bookingUpdateError;
        }
      }

      const { error: reviewsError } = await supabase
        .from('reviews')
        .update({ service_id: null })
        .eq('service_id', serviceId);

      if (reviewsError) {
        throw reviewsError;
      }

      const { error: masterServicesError } = await supabase
        .from('master_services')
        .delete()
        .eq('service_id', serviceId);

      if (masterServicesError) {
        throw masterServicesError;
      }

      const { error: deleteError } = await supabase.from('services').delete().eq('id', serviceId);

      if (deleteError) {
        throw deleteError;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <AdminPrimaryButton stretched onClick={handleAdd}>
        + Добавить услугу
      </AdminPrimaryButton>

      {services.length === 0 ? (
        <AdminEmptyState text="Услуги ещё не добавлены." />
      ) : (
        services.map((service) => (
          <AdminCard key={service.id}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Text style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}>
                  {service.name}
                </Text>
                <AdminChip
                  label={service.is_active ? 'Активна' : 'Скрыта'}
                  tone={service.is_active ? 'green' : 'orange'}
                />
                {service.category && <AdminChip label={service.category} tone="blue" />}
              </div>

              {service.description && (
                <Text style={{ fontSize: '14px', opacity: 0.74, lineHeight: 1.5 }}>
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
                  backgroundColor: 'rgba(255,255,255,0.035)',
                }}
              >
                <AdminDetailRow label="Цена" value={`${service.price} ₽`} />
                <AdminDetailRow label="Длительность" value={`${service.duration_minutes} мин`} />
                {!service.description && !service.category && (
                  <Text style={{ fontSize: '14px', opacity: 0.6 }}>
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
                  style={{ color: service.is_active ? '#ffcf70' : '#7ee787' }}
                >
                  {service.is_active ? 'Деактивировать' : 'Активировать'}
                </Button>
                <Button
                  mode="outline"
                  size="s"
                  onClick={() => handleDelete(service.id)}
                  style={{ color: '#ff9a92' }}
                >
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
