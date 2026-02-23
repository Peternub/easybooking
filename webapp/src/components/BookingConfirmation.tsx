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
  const [clientName, setClientName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handlePromoCodeCheck = async () => {
    if (!promoCode.trim()) {
      setPromoDiscount(0);
      setPromoError('');
      return;
    }

    if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
      setPromoError('Ошибка: не удалось получить данные пользователя');
      return;
    }

    const user = window.Telegram.WebApp.initDataUnsafe.user;
    const clientTelegramId = user.id;

    try {
      const botApiUrl = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';
      const response = await fetch(`${botApiUrl}/api/validate-promo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promoCode.toUpperCase(),
          clientTelegramId,
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setPromoDiscount(result.discount);
        setPromoError('');
      } else {
        setPromoDiscount(0);
        setPromoError(result.message || 'Промокод недействителен');
      }
    } catch (error) {
      console.error('Ошибка проверки промокода:', error);
      setPromoError('Не удалось проверить промокод');
      setPromoDiscount(0);
    }
  };

  const handleConfirm = async () => {
    if (!clientName.trim()) {
      alert('Пожалуйста, введите ваше имя');
      return;
    }

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
    const clientUsername = user.username || null;

    console.log('Клиент:', { clientTelegramId, clientName, clientUsername });
    console.log('Запись:', { serviceId, masterId, date, time });

    try {
      // Создаем запись напрямую в Supabase
      console.log('📝 Отправка данных в Supabase...');

      const originalPrice = service.price;
      const discountAmount = Math.round((originalPrice * promoDiscount) / 100);
      const finalPrice = originalPrice - discountAmount;

      console.log('Данные для вставки:', {
        client_telegram_id: clientTelegramId,
        client_name: clientName,
        client_username: clientUsername,
        master_id: masterId,
        service_id: serviceId,
        booking_date: date,
        booking_time: time,
        status: 'active',
        original_price: originalPrice,
        discount_amount: discountAmount,
        final_price: finalPrice,
        promo_code: promoCode.toUpperCase() || null,
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
          original_price: originalPrice,
          discount_amount: discountAmount,
          final_price: finalPrice,
          promo_code: promoCode.toUpperCase() || null,
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
        const botApiUrl = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';
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
            promoCode: promoCode.toUpperCase() || undefined,
          }),
        });

        if (notifyResponse.ok) {
          console.log('✅ Уведомления отправлены');
        } else {
          console.warn('⚠️ Не удалось отправить уведомления:', await notifyResponse.text());
        }
      } catch (notifyError) {
        console.warn('⚠️ Ошибка отправки уведомлений (бот может быть не запущен):', notifyError);
        // Не блокируем создание записи, если бот недоступен
      }

      // Показываем успешное сообщение перед закрытием
      alert('✅ Запись успешно создана!\n\nУведомления будут отправлены ботом.');

      // Закрываем Mini App
      setTimeout(() => {
        window.Telegram?.WebApp?.close();
      }, 500);
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

        <div>
          <Text style={{ fontSize: '14px', opacity: 0.6 }}>Стоимость</Text>
          <Title level="2">{service.price} ₽</Title>
        </div>
      </Card>

      <Card style={{ padding: '16px', marginBottom: '16px' }}>
        <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px', display: 'block' }}>
          Ваше имя
        </Text>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Введите ваше имя"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid var(--tgui--divider_color)',
            borderRadius: '8px',
            backgroundColor: 'var(--tgui--secondary_bg_color)',
            color: 'var(--tgui--text_color)',
            outline: 'none',
          }}
        />
      </Card>

      <Card style={{ padding: '16px', marginBottom: '16px' }}>
        <Text style={{ fontSize: '14px', opacity: 0.6, marginBottom: '8px', display: 'block' }}>
          Промокод (необязательно)
        </Text>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={promoCode}
            onChange={(e) => {
              setPromoCode(e.target.value.toUpperCase());
              setPromoError('');
              setPromoDiscount(0);
            }}
            placeholder="Введите промокод"
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              border: '1px solid var(--tgui--divider_color)',
              borderRadius: '8px',
              backgroundColor: 'var(--tgui--secondary_bg_color)',
              color: 'var(--tgui--text_color)',
              outline: 'none',
              textTransform: 'uppercase',
            }}
          />
          <Button mode="outline" onClick={handlePromoCodeCheck} disabled={!promoCode.trim()}>
            Применить
          </Button>
        </div>
        {promoError && (
          <Text
            style={{
              color: 'var(--tgui--destructive_text_color)',
              fontSize: '14px',
              marginTop: '8px',
            }}
          >
            {promoError}
          </Text>
        )}
        {promoDiscount > 0 && (
          <Text style={{ color: 'var(--tgui--link_color)', fontSize: '14px', marginTop: '8px' }}>
            ✅ Скидка {promoDiscount}% применена!
          </Text>
        )}
      </Card>

      {promoDiscount > 0 && service && (
        <Card style={{ padding: '16px', marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <Text style={{ fontSize: '14px' }}>Исходная цена:</Text>
            <Text style={{ fontSize: '14px', textDecoration: 'line-through', opacity: 0.6 }}>
              {service.price} ₽
            </Text>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <Text style={{ fontSize: '14px' }}>Скидка ({promoDiscount}%):</Text>
            <Text style={{ fontSize: '14px', color: 'var(--tgui--link_color)' }}>
              -{Math.round((service.price * promoDiscount) / 100)} ₽
            </Text>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '8px',
              borderTop: '1px solid var(--tgui--divider_color)',
            }}
          >
            <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>Итого:</Text>
            <Title level="2" style={{ margin: 0 }}>
              {service.price - Math.round((service.price * promoDiscount) / 100)} ₽
            </Title>
          </div>
        </Card>
      )}

      <Button
        size="l"
        stretched
        onClick={handleConfirm}
        disabled={submitting || !clientName.trim()}
      >
        {submitting ? 'Создание записи...' : 'Записаться'}
      </Button>
    </div>
  );
}
