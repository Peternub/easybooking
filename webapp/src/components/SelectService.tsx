import { Card, Placeholder, Spinner, Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Service } from '../../../shared/types';
import { supabase } from '../services/supabase';

interface Props {
  onSelect: (serviceId: string) => void;
}

export function SelectService({ onSelect }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Ошибка загрузки услуг:', err);
      setError('Не удалось загрузить услуги');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (error) {
    return <Placeholder header="Ошибка" description={error} />;
  }

  if (services.length === 0) {
    return <Placeholder header="Нет услуг" description="Услуги пока не добавлены" />;
  }

  return (
    <div>
      <div
        style={{
          backgroundColor: '#6C757D',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '16px',
        }}
      >
        <Title level="1" style={{ margin: 0, color: '#FFFFFF' }}>
          Выберите услугу
        </Title>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {services.map((service) => (
          <Card
            key={service.id}
            onClick={() => onSelect(service.id)}
            style={{ cursor: 'pointer', padding: '16px' }}
          >
            <Title level="3">{service.name}</Title>
            {service.description && (
              <Text style={{ marginTop: '8px', marginBottom: '12px' }}>{service.description}</Text>
            )}
            <div style={{ marginTop: '8px' }}>
              <Text weight="2">{service.price} ₽</Text>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
