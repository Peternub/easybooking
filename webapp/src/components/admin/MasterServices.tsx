import { Button, Card, Section, Spinner, Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Master, Service } from '../../../../shared/types';
import { supabase } from '../../services/supabase';

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
      // Загружаем все услуги
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (servicesError) throw servicesError;

      // Загружаем услуги мастера
      const { data: masterServicesData, error: masterServicesError } = await supabase
        .from('master_services')
        .select('service_id, services(*)')
        .eq('master_id', master.id);

      if (masterServicesError) throw masterServicesError;

      setAllServices(services || []);
      setMasterServices(
        masterServicesData?.map((item: { services: Service }) => item.services) || [],
      );
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
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
    if (!confirm('Удалить эту услугу у мастера?')) {
      return;
    }

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

  const masterServiceIds = new Set(masterServices.map((s) => s.id));
  const availableServices = allServices.filter((s) => !masterServiceIds.has(s.id));

  return (
    <div>
      <Section header="Услуги мастера">
        {masterServices.length === 0 ? (
          <Text style={{ opacity: 0.6, textAlign: 'center', padding: '20px' }}>
            У мастера нет услуг
          </Text>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}
          >
            {masterServices.map((service) => (
              <Card key={service.id} style={{ padding: '12px' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>{service.name}</Text>
                    <Text style={{ fontSize: '14px', opacity: 0.6 }}>
                      {service.price} ₽ • {service.duration_minutes} мин
                    </Text>
                  </div>
                  <Button
                    mode="outline"
                    size="s"
                    onClick={() => handleRemoveService(service.id)}
                    style={{ color: '#F44336' }}
                  >
                    Удалить
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      {availableServices.length > 0 && (
        <Section header="Добавить услугу">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {availableServices.map((service) => (
              <Card key={service.id} style={{ padding: '12px' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>{service.name}</Text>
                    <Text style={{ fontSize: '14px', opacity: 0.6 }}>
                      {service.price} ₽ • {service.duration_minutes} мин
                    </Text>
                  </div>
                  <Button mode="outline" size="s" onClick={() => handleAddService(service.id)}>
                    + Добавить
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
