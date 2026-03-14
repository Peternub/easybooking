import { Button, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Master, Service } from '../../../../shared/types';
import { supabase } from '../../services/supabase';
import { AdminCard, AdminPrimaryButton } from './AdminTheme';

interface Props {
  master: Master;
}

export function MasterServices({ master }: Props) {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [masterServices, setMasterServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: master.id нужен для перезагрузки
  useEffect(() => {
    loadServices();
  }, [master.id]);

  async function loadServices() {
    try {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (servicesError) throw servicesError;

      const { data: masterServicesData, error: masterServicesError } = await supabase
        .from('master_services')
        .select('service_id, services(*)')
        .eq('master_id', master.id);
      if (masterServicesError) throw masterServicesError;

      setAllServices(services || []);

      const masterServicesList = (masterServicesData || [])
        .map((item: { services: Service | Service[] }) => {
          const serviceData = item.services;
          return Array.isArray(serviceData) ? serviceData[0] : serviceData;
        })
        .filter((service): service is Service => service !== null && service !== undefined);

      setMasterServices(masterServicesList);
    } catch (error) {
      console.error('Ошибка загрузки услуг мастера:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddService(serviceId: string) {
    try {
      const { error } = await supabase.from('master_services').insert({
        master_id: master.id,
        service_id: serviceId,
      });
      if (error) throw error;

      alert('Услуга добавлена');
      loadServices();
    } catch (error) {
      console.error('Ошибка добавления услуги:', error);
      alert('Не удалось добавить услугу');
    }
  }

  async function handleRemoveService(serviceId: string) {
    if (!confirm('Удалить эту услугу у мастера?')) return;

    try {
      const { error } = await supabase
        .from('master_services')
        .delete()
        .eq('master_id', master.id)
        .eq('service_id', serviceId);
      if (error) throw error;

      alert('Услуга удалена');
      loadServices();
    } catch (error) {
      console.error('Ошибка удаления услуги:', error);
      alert('Не удалось удалить услугу');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  const masterServiceIds = new Set(masterServices.map((service) => service.id));
  const availableServices = allServices.filter((service) => !masterServiceIds.has(service.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <AdminCard style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Text style={{ fontSize: '32px', fontWeight: 700, color: 'var(--app-text)' }}>
            Услуги мастера
          </Text>
          <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>
            Выберите услуги, которые оказывает мастер.
          </Text>
        </div>
      </AdminCard>

      {masterServices.length === 0 ? (
        <AdminCard style={{ padding: '16px', textAlign: 'center' }}>
          <Text style={{ color: 'var(--app-text-soft)' }}>У мастера пока нет услуг.</Text>
        </AdminCard>
      ) : (
        masterServices.map((service) => (
          <AdminCard key={service.id} style={{ padding: '14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Text style={{ fontSize: '17px', fontWeight: 700, color: 'var(--app-text)' }}>
                  {service.name}
                </Text>
                <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>
                  {service.price} ₽
                </Text>
              </div>
              <Button
                mode="outline"
                size="s"
                onClick={() => handleRemoveService(service.id)}
                style={{ color: 'var(--app-danger)' }}
              >
                Удалить
              </Button>
            </div>
          </AdminCard>
        ))
      )}

      {availableServices.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Text style={{ fontSize: '16px', fontWeight: 700, color: 'var(--app-text)' }}>
            Добавить услугу
          </Text>
          {availableServices.map((service) => (
            <AdminCard key={service.id} style={{ padding: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Text style={{ fontSize: '17px', fontWeight: 700, color: 'var(--app-text)' }}>
                    {service.name}
                  </Text>
                  <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>
                    {service.price} ₽
                  </Text>
                </div>
                <AdminPrimaryButton onClick={() => handleAddService(service.id)}>
                  + Добавить
                </AdminPrimaryButton>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
