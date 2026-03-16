import { Button, Card, Spinner, Text, Title } from '@telegram-apps/telegram-ui';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { Master, Service } from '../../../shared/types';
import { supabase } from '../services/supabase';
import {
  backButtonStyle,
  inputStyle,
  pageShellStyle,
  softPanelStyle,
  surfaceCardStyle,
  titleStyle,
} from './AppTheme';

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
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [masterData, serviceData] = await Promise.all([
        supabase.from('masters').select('*').eq('id', masterId).single(),
        supabase.from('services').select('*').eq('id', serviceId).single(),
      ]);

      if (masterData.data) setMaster(masterData.data);
      if (serviceData.data) setService(serviceData.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePromoCodeCheck() {
    if (!promoCode.trim()) {
      setPromoDiscount(0);
      setPromoError('');
      return;
    }

    if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
      setPromoError('Ошибка: не удалось получить данные пользователя');
      return;
    }

    const clientTelegramId = window.Telegram.WebApp.initDataUnsafe.user.id;

    try {
      const botApiUrl = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';
      const response = await fetch(`${botApiUrl}/api/validate-promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  }

  async function handleConfirm() {
    if (!clientName.trim()) {
      alert('Пожалуйста, введите ваше имя и фамилию');
      return;
    }

    if (!clientPhone.trim()) {
      alert('Пожалуйста, введите номер телефона');
      return;
    }

    setSubmitting(true);
    setBookingSuccess(false);

    if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
      alert('Ошибка: не удалось получить данные пользователя');
      setSubmitting(false);
      return;
    }

    const user = window.Telegram.WebApp.initDataUnsafe.user;
    const clientTelegramId = user.id;
    const clientUsername = user.username || null;

    if (!service || !master) {
      alert('Ошибка: данные услуги или мастера не загружены');
      setSubmitting(false);
      return;
    }

    try {
      const originalPrice = service.price;
      const discountAmount = Math.round((originalPrice * promoDiscount) / 100);
      const finalPrice = originalPrice - discountAmount;

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          client_telegram_id: clientTelegramId,
          client_name: clientName,
          client_phone: clientPhone,
          client_username: clientUsername,
          master_id: masterId,
          service_id: serviceId,
          booking_date: date,
          booking_time: time,
          status: 'active',
          source: 'online',
          cancellation_reason: null,
          google_event_id: null,
          original_price: originalPrice,
          discount_amount: discountAmount,
          final_price: finalPrice,
          promo_code: promoCode.toUpperCase() || null,
        })
        .select()
        .single();

      if (error || !booking) {
        alert(`Ошибка создания записи: ${error?.message || 'неизвестная ошибка'}`);
        setSubmitting(false);
        return;
      }

      try {
        const botApiUrl = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';
        await fetch(`${botApiUrl}/api/notify-booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            clientTelegramId,
            clientName,
            clientUsername,
            masterId,
            serviceId,
            bookingDate: date,
            bookingTime: time,
            originalPrice,
            discountAmount,
            finalPrice,
            promoCode: promoCode.toUpperCase() || undefined,
          }),
        });
      } catch (notifyError) {
        console.warn('Ошибка отправки уведомлений:', notifyError);
      }

      setBookingSuccess(true);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Ошибка бронирования:', error);
      alert('Произошла ошибка. Попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (!master || !service) {
    return (
      <div style={pageShellStyle}>
        <Text>Ошибка загрузки данных</Text>
        <Button size="l" stretched onClick={onBack}>
          Назад
        </Button>
      </div>
    );
  }

  const dateFormatted = format(new Date(date), 'd MMMM yyyy', { locale: ru });
  const finalPrice = service.price - Math.round((service.price * promoDiscount) / 100);

  return (
    <div style={pageShellStyle}>
      {showSuccessPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(57, 38, 24, 0.28)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '24px',
              borderRadius: '28px',
              background:
                'linear-gradient(180deg, rgba(255, 250, 244, 0.98) 0%, rgba(247, 236, 221, 0.98) 100%)',
              border: '1px solid rgba(174, 122, 79, 0.18)',
              boxShadow: '0 24px 60px rgba(96, 66, 40, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <Title level="2" style={{ margin: 0, color: 'var(--app-text)' }}>
              Запись подтверждена
            </Title>

            <Text style={{ color: 'var(--app-text-soft)', lineHeight: 1.5 }}>
              Вы успешно записаны на услугу {service.name} к мастеру {master.name}.
            </Text>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: '18px',
                background: 'rgba(231, 214, 193, 0.55)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <Text style={{ color: 'var(--app-text)', fontWeight: 700 }}>
                {dateFormatted} в {time}
              </Text>
              <Text style={{ color: 'var(--app-text-soft)', fontSize: '14px' }}>
                Мы отправим напоминание в Telegram перед визитом.
              </Text>
            </div>

            <Button
              size="l"
              stretched
              onClick={() => setShowSuccessPopup(false)}
              style={{
                backgroundColor: 'var(--app-accent)',
                color: '#fffaf3',
                borderRadius: '18px',
                fontWeight: 700,
              }}
            >
              Отлично
            </Button>
          </div>
        </div>
      )}

      <Button mode="plain" onClick={onBack} style={backButtonStyle}>
        Назад
      </Button>

      <Title level="1" style={titleStyle}>
        Подтверждение записи
      </Title>

      <div style={softPanelStyle}>
        <Text style={{ color: 'var(--app-text-soft)', fontSize: '13px', textAlign: 'center' }}>
          Если хотите сделать несколько записей, используйте одно и то же имя для всех визитов.
        </Text>
      </div>

      <Card style={surfaceCardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>Услуга</Text>
            <Title level="3" style={{ color: 'var(--app-text)' }}>
              {service.name}
            </Title>
          </div>

          <div>
            <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>Мастер</Text>
            <Title level="3" style={{ color: 'var(--app-text)' }}>
              {master.name}
            </Title>
          </div>

          <div>
            <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>Дата и время</Text>
            <Title level="3" style={{ color: 'var(--app-text)' }}>
              {dateFormatted} в {time}
            </Title>
          </div>

          <div>
            <Text style={{ fontSize: '14px', color: 'var(--app-text-soft)' }}>Стоимость</Text>
            {promoDiscount > 0 ? (
              <div style={{ marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text style={{ fontSize: '18px', textDecoration: 'line-through', opacity: 0.5 }}>
                    {service.price} ₽
                  </Text>
                  <Title level="2" style={{ margin: 0, color: 'var(--app-accent-strong)' }}>
                    {finalPrice} ₽
                  </Title>
                </div>
                <Text style={{ fontSize: '13px', color: 'var(--app-text-soft)', marginTop: '4px' }}>
                  Скидка: {Math.round((service.price * promoDiscount) / 100)} ₽ ({promoDiscount}%)
                </Text>
              </div>
            ) : (
              <Title level="2" style={{ color: 'var(--app-accent-strong)' }}>
                {service.price} ₽
              </Title>
            )}
            <Text style={{ fontSize: '13px', color: 'var(--app-text-soft)', marginTop: '4px' }}>
              Оплата в салоне
            </Text>
          </div>
        </div>
      </Card>

      <Card style={surfaceCardStyle}>
        <Text
          style={{
            fontSize: '14px',
            color: 'var(--app-text-soft)',
            marginBottom: '8px',
            display: 'block',
          }}
        >
          Имя и фамилия *
        </Text>
        <input
          type="text"
          value={clientName}
          onChange={(event) => setClientName(event.target.value)}
          placeholder="Иван Иванов"
          style={inputStyle}
        />
      </Card>

      <Card style={surfaceCardStyle}>
        <Text
          style={{
            fontSize: '14px',
            color: 'var(--app-text-soft)',
            marginBottom: '8px',
            display: 'block',
          }}
        >
          Номер телефона *
        </Text>
        <input
          type="tel"
          value={clientPhone}
          onChange={(event) => setClientPhone(event.target.value)}
          placeholder="+7 (999) 123-45-67"
          style={inputStyle}
        />
      </Card>

      <Card style={surfaceCardStyle}>
        <Text
          style={{
            fontSize: '14px',
            color: 'var(--app-text-soft)',
            marginBottom: '8px',
            display: 'block',
          }}
        >
          Промокод
        </Text>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={promoCode}
            onChange={(event) => {
              setPromoCode(event.target.value.toUpperCase());
              setPromoError('');
              setPromoDiscount(0);
            }}
            placeholder="Введите промокод"
            style={{ ...inputStyle, textTransform: 'uppercase' }}
          />
          <Button mode="outline" onClick={handlePromoCodeCheck} disabled={!promoCode.trim()}>
            Применить
          </Button>
        </div>
        {promoError && (
          <Text style={{ color: 'var(--app-danger)', fontSize: '14px', marginTop: '8px' }}>
            {promoError}
          </Text>
        )}
        {promoDiscount > 0 && (
          <Text style={{ color: 'var(--app-accent-strong)', fontSize: '14px', marginTop: '8px' }}>
            Скидка {promoDiscount}% применена
          </Text>
        )}
      </Card>

      <Button
        size="l"
        stretched
        onClick={handleConfirm}
        disabled={submitting || bookingSuccess || !clientName.trim() || !clientPhone.trim()}
        style={{
          backgroundColor: 'var(--app-accent)',
          color: '#fffaf3',
          borderRadius: '18px',
        }}
      >
        {submitting ? 'Бронирование...' : bookingSuccess ? 'Забронировано' : 'Забронировать услугу'}
      </Button>
    </div>
  );
}
