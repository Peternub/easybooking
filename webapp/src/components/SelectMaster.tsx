import { Button, Card, Placeholder, Spinner, Text, Title } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Master } from '../../../shared/types';
import { supabase } from '../services/supabase';
import { backButtonStyle, pageShellStyle, surfaceCardStyle, titleStyle } from './AppTheme';

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
  }, []);

  async function loadMasters() {
    try {
      const { data, error } = await supabase
        .from('master_services')
        .select('master_id, masters(*)')
        .eq('service_id', serviceId);

      if (error) {
        throw error;
      }

      const mastersData = (data || [])
        .map((item: { master_id: string; masters: Master | Master[] }) => {
          return Array.isArray(item.masters) ? item.masters[0] : item.masters;
        })
        .filter((master: Master | undefined) => master?.is_active) as Master[];

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
      <div style={pageShellStyle}>
        <Placeholder header="Ошибка" description={error} />
        <Button size="l" stretched onClick={onBack}>
          Назад
        </Button>
      </div>
    );
  }

  if (masters.length === 0) {
    return (
      <div style={pageShellStyle}>
        <Placeholder
          header="Нет мастеров"
          description="Для этой услуги пока нет доступных мастеров"
        />
        <Button size="l" stretched onClick={onBack}>
          Назад
        </Button>
      </div>
    );
  }

  return (
    <div style={pageShellStyle}>
      <Button mode="plain" onClick={onBack} style={backButtonStyle}>
        Назад
      </Button>

      <Title level="1" style={titleStyle}>
        Выберите мастера
      </Title>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {masters.map((master) => (
          <Card
            key={master.id}
            onClick={() => onSelect(master.id)}
            style={{ ...surfaceCardStyle, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {master.photo_url && (
                <img
                  src={master.photo_url}
                  alt={master.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    objectFit: 'cover',
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <Title level="3" style={{ color: 'var(--app-text)' }}>
                  {master.name}
                </Title>
                {master.specialization && (
                  <Text style={{ marginTop: '4px', color: 'var(--app-text-soft)' }}>
                    {master.specialization}
                  </Text>
                )}
                {master.description && (
                  <Text
                    style={{ marginTop: '8px', fontSize: '14px', color: 'var(--app-text-soft)' }}
                  >
                    {master.description}
                  </Text>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
