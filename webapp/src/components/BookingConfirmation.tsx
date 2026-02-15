import { Button, Card, Spinner, Text, Title } from '@telegram-apps/telegram-ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { Master, Service } from '../../../shared/types';
import { supabase } from '../services/supabase';

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

    console.log('=== ОТПРАВКА ДАННЫХ ===');
    console.log('Данные для отправки:', data);
    console.log('Telegram WebApp объект:', window.Telegram?.WebApp);
    console.log('initData:', window.Telegram?.WebApp?.initData);
    console.log('initDataUnsafe:', window.Telegram?.WebApp?.initDataUnsafe);

    if (!window.Telegram?.WebApp) {
      console.error('❌ Telegram WebApp недоступен');
      setSubmitting(false);
      alert('Приложение должно быть открыто в Telegram');
      return;
    }

    try {
      const jsonData = JSON.stringify(data);
      console.log('JSON строка:', jsonData);

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.sendData(jsonData);
        console.log('✅ sendData() вызван успешно');

        // После успешной отправки Mini App должен закрыться автоматически
        // Если этого не происходит, закрываем вручную через 1 секунду
        setTimeout(() => {
          console.log('Закрытие Mini App...');
          window.Telegram?.WebApp?.close();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Ошибка отправки данных:', error);
      setSubmitting(false);
      alert('Ошибка отправки данных. Попробуйте еще раз.');
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
