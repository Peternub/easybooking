import { useState, useEffect } from 'react';
import { Button, Title, Text, Spinner, Card } from '@telegram-apps/telegram-ui';
import { supabase } from '../services/supabase';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Master, Service } from '../../../shared/types';

interface Props {
  serviceId: string;
  masterId: string;
  date: string;
  time: string;
  onBack: () => void;
}

export function BookingConfirmation({ serviceId, masterId, date, time, onBack }: Props) {
  const [master, setMaster] = useState<Master | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [serviceId, masterId]);

  async function loadData() {
    try {
      const [masterData, serviceData] = await Promise.all([
        supabase.from('masters').select('*').eq('id', masterId).single(),
        supabase.from('services').select('*').eq('id', serviceId).single(),
      ]);

      if (masterData.data) setMaster(masterData.data);
      if (serviceData.data) setService(serviceData.data);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleConfirm = () => {
    setSubmitting(true);

    const data = {
      type: 'booking',
      serviceId,
      masterId,
      date,
      time,
    };

    console.log('Отправка данных:', data);
    console.log('Telegram WebApp доступен:', !!window.Telegram?.WebApp);

    if (window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.sendData(JSON.stringify(data));
        console.log('Данные отправлены успешно');
      } catch (error) {
        console.error('Ошибка отправки данных:', error);
        setSubmitting(false);
        alert('Ошибка отправки данных. Попробуйте еще раз.');
      }
    } else {
      console.error('Telegram WebApp недоступен');
      setSubmitting(false);
      alert('Приложение должно быть открыто в Telegram');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (!master || !service) {
    return (
      <>
        <Text>Ошибка загрузки данных</Text>
        <Button size="l" stretched onClick={onBack} style={{ marginTop: '16px' }}>
          Назад
        </Button>
      </>
    );
  }

  const dateFormatted = format(new Date(date), 'd MMMM yyyy', { locale: ru });

  return (
    <div>
      <Button mode="plain" onClick={onBack} style={{ marginBottom: '16px' }}>
        ← Назад
      </Button>

      <Title level="1" style={{ marginBottom: '16px' }}>
        Подтверждение записи
      </Title>

      <Card style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Text style={{ fontSize: '14px', opacity: 0.6 }}>Услуга</Text>
          <Title level="3">{service.name}</Title>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Text style={{ fontSize: '14px', opacity: 0.6 }}>Мастер</Text>
          <Title level="3">{master.name}</Title>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Text style={{ fontSize: '14px', opacity: 0.6 }}>Дата и время</Text>
          <Title level="3">
            {dateFormatted} в {time}
          </Title>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Text style={{ fontSize: '14px', opacity: 0.6 }}>Длительность</Text>
          <Text weight="2">{service.duration_minutes} минут</Text>
        </div>

        <div>
          <Text style={{ fontSize: '14px', opacity: 0.6 }}>Стоимость</Text>
          <Title level="2">{service.price} ₽</Title>
        </div>
      </Card>

      <Button size="l" stretched onClick={handleConfirm} disabled={submitting}>
        {submitting ? 'Создание записи...' : 'Записаться'}
      </Button>
    </div>
  );
}
