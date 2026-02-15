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

  const handleConfirm = async () => {
    setSubmitting(true);

    console.log('=== СОЗДАНИЕ ЗАПИСИ ===');
    console.log('Telegram WebApp:', window.Telegram?.WebApp);
    console.log('User:', window.Telegram?.WebApp?.initDataUnsafe?.user);

    if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
      console.error('❌ Нет данных пользователя Telegram');
      alert('Ошибка: не удалось получить данные пользователя');
      setSubmitting(false);
      return;
    }

    const user = window.Telegram.WebApp.initDataUnsafe.user;
    const clientTelegramId = user.id;
    const clientName = `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`;
    const clientUsername = user.username || null;

    console.log('Клиент:', { clientTelegramId, clientName, clientUsername });
    console.log('Запись:', { serviceId, masterId, date, time });

    try {
      // Создаем запись напрямую в Supabase
      console.log('📝 Отправка данных в Supabase...');
      console.log('Данные для вставки:', {
        client_telegram_id: clientTelegramId,
        client_name: clientName,
        client_username: clientUsername,
        master_id: masterId,
        service_id: serviceId,
        booking_date: date,
        booking_time: time,
        status: 'active',
      });

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          client_telegram_id: clientTelegramId,
          client_name: clientName,
          client_username: clientUsername,
          master_id: masterId,
          service_id: serviceId,
          booking_date: date,
          booking_time: time,
          status: 'active',
          cancellation_reason: null,
          google_event_id: null,
        })
        .select()
        .single();

      console.log('📊 Ответ от Supabase:', { data: booking, error });

      if (error) {
        console.error('❌ Ошибка создания записи:', error);
        console.error('Детали ошибки:', JSON.stringify(error, null, 2));
        alert(`Ошибка создания записи: ${error.message}\n\nПроверьте консоль для деталей.`);
        setSubmitting(false);
        return;
      }

      if (!booking) {
        console.error('❌ Запись не создана (нет данных)');
        alert('Ошибка: запись не создана');
        setSubmitting(false);
        return;
      }

      console.log('✅ Запись успешно создана в Supabase:', booking);

      // Отправляем уведомления через API бота
      try {
        // В продакшене используем тот же домен, в разработке - localhost
        const botApiUrl = import.meta.env.VITE_BOT_API_URL || window.location.origin;
        console.log('📧 Отправка уведомлений через бота:', botApiUrl);

        const notifyResponse = await fetch(`${botApiUrl}/api/notify-booking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: booking.id,
            clientTelegramId: clientTelegramId,
            clientName: clientName,
            clientUsername: clientUsername,
            masterId: masterId,
            serviceId: serviceId,
            bookingDate: date,
            bookingTime: time,
          }),
        });

        if (notifyResponse.ok) {
          console.log('✅ Уведомления отправлены');
        } else {
          console.warn('⚠️ Не удалось отправить уведомления:', await notifyResponse.text());
        }
      } catch (notifyError) {
        console.warn('⚠️ Ошибка отправки уведомлений:', notifyError);
      }

      // Закрываем Mini App (уведомления придут от бота)
      window.Telegram?.WebApp?.close();
    } catch (error) {
      console.error('❌ Ошибка:', error);
      alert('Произошла ошибка. Попробуйте еще раз.');
      setSubmitting(false);
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
