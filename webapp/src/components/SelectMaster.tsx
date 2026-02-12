import { useState, useEffect } from 'react';
import { Card, Title, Text, Spinner, Placeholder, Button } from '@telegram-apps/telegram-ui';
import { supabase } from '../services/supabase';
import type { Master } from '../../../shared/types';

interface Props {
  serviceId: string;
  onSelect: (masterId: string) => void;
  onBack: () => void;
}

export function SelectMaster({ serviceId, onSelect, onBack }: Props) {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMasters();
  }, [serviceId]);

  async function loadMasters() {
    try {
      const { data, error } = await supabase
        .from('master_services')
        .select('master_id, masters(*)')
        .eq('service_id', serviceId);

      if (error) throw error;

      const mastersData = data
        .map((item: any) => item.masters)
        .filter((master: Master) => master && master.is_active);

      setMasters(mastersData);
    } catch (err) {
      console.error('Ошибка загрузки мастеров:', err);
      setError('Не удалось загрузить список мастеров');
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
    return (
      <>
        <Placeholder header="Ошибка" description={error} />
        <Button size="l" stretched onClick={onBack} style={{ marginTop: '16px' }}>
          Назад
        </Button>
      </>
    );
  }

  if (masters.length === 0) {
    return (
      <>
        <Placeholder
          header="Нет мастеров"
          description="Для этой услуги пока нет доступных мастеров"
        />
        <Button size="l" stretched onClick={onBack} style={{ marginTop: '16px' }}>
          Назад
        </Button>
      </>
    );
  }

  return (
    <div>
      <Button mode="plain" onClick={onBack} style={{ marginBottom: '16px' }}>
        ← Назад
      </Button>

      <Title level="1" style={{ marginBottom: '16px' }}>
        Выберите мастера
      </Title>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {masters.map((master) => (
          <Card
            key={master.id}
            onClick={() => onSelect(master.id)}
            style={{ cursor: 'pointer', padding: '16px' }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {master.photo_url && (
                <img
                  src={master.photo_url}
                  alt={master.name}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <Title level="3">{master.name}</Title>
                {master.specialization && (
                  <Text style={{ marginTop: '4px' }}>{master.specialization}</Text>
                )}
                {master.description && (
                  <Text style={{ marginTop: '8px', fontSize: '14px' }}>{master.description}</Text>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
