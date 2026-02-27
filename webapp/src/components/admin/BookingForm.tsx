import { Button, Input, Section, Textarea } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Master, Service } from '../../../../shared/types';
import { supabase } from '../../services/supabase';

interface Props {
  onClose: () => void;
}

export function BookingForm({ onClose }: Props) {
  const [masters, setMasters] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMasters();
    loadServices();
  }, []);

  async function loadMasters() {
    try {
      const { data, error } = await supabase
        .from('masters')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMasters(data || []);
    } catch (error) {
      console.error('Ошибка загрузки мастеров:', error);
    }
  }

  async function loadServices() {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Ошибка загрузки услуг:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedMasterId || !selectedServiceId || !clientName || !bookingDate || !bookingTime) {
      alert('Заполните все обязательные поля');
      return;
    }

    setSaving(true);

    try {
      // Получаем информацию об услуге для цены
      const service = services.find((s) => s.id === selectedServiceId);
      if (!service) {
        alert('Услуга не найдена');
        return;
      }

      // Создаем или находим клиента
      let clientId = null;
      if (clientPhone) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('phone', clientPhone)
          .single();

        if (existingClient) {
          clientId = existingClient.id;
        } else {
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              name: clientName,
              phone: clientPhone,
              telegram_id: null,
              username: null,
              notes: notes || null,
            })
            .select()
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }
      }

      // Создаем запись
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_telegram_id: 0, // Для ручных записей используем 0
          client_name: clientName,
          client_username: null,
          client_id: clientId,
          master_id: selectedMasterId,
          service_id: selectedServiceId,
          booking_date: bookingDate,
          booking_time: `${bookingTime}:00`,
          status: 'active',
          source: 'manual', // Помечаем как ручную запись
          original_price: service.price,
          discount_amount: 0,
          final_price: service.price,
          promo_code: null,
          admin_notes: notes || null,
          google_event_id: null,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Отправляем запрос на создание события в Google Calendar через бота
      try {
        await fetch(
          `${import.meta.env.VITE_BOT_API_URL || 'http://localhost:3000'}/api/notify-booking`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: booking.id,
              clientTelegramId: 0,
              clientName,
              clientUsername: null,
              masterId: selectedMasterId,
              serviceId: selectedServiceId,
              bookingDate,
              bookingTime: `${bookingTime}:00`,
              originalPrice: service.price,
              discountAmount: 0,
              finalPrice: service.price,
              promoCode: null,
            }),
          },
        );
      } catch (error) {
        console.error('Ошибка создания события в календаре:', error);
        // Продолжаем даже если не удалось создать событие
      }

      alert('Запись создана');
      onClose();
    } catch (error) {
      console.error('Ошибка создания записи:', error);
      alert('Не удалось создать запись');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Button mode="plain" onClick={onClose} style={{ marginBottom: '16px' }}>
        ← Назад к списку
      </Button>

      <Section header="Новая запись (вручную)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="master"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            >
              Мастер *
            </label>
            <select
              id="master"
              value={selectedMasterId}
              onChange={(e) => setSelectedMasterId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid var(--tgui--divider_color)',
                borderRadius: '8px',
                backgroundColor: 'var(--tgui--secondary_bg_color)',
                color: 'var(--tgui--text_color)',
              }}
            >
              <option value="">Выберите мастера</option>
              {masters.map((master) => (
                <option key={master.id} value={master.id}>
                  {master.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="service"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            >
              Услуга *
            </label>
            <select
              id="service"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid var(--tgui--divider_color)',
                borderRadius: '8px',
                backgroundColor: 'var(--tgui--secondary_bg_color)',
                color: 'var(--tgui--text_color)',
              }}
            >
              <option value="">Выберите услугу</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {service.price} ₽
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="client-name"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            >
              Имя клиента *
            </label>
            <Input
              id="client-name"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Иван Иванов"
              required
            />
          </div>

          <div>
            <label
              htmlFor="client-phone"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            >
              Телефон клиента
            </label>
            <Input
              id="client-phone"
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div>
            <label
              htmlFor="booking-date"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            >
              Дата записи *
            </label>
            <Input
              id="booking-date"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="booking-time"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            >
              Время записи *
            </label>
            <Input
              id="booking-time"
              type="time"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            >
              Заметки
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация о клиенте или записи"
              rows={3}
            />
          </div>

          <Button type="submit" mode="filled" size="l" stretched disabled={saving}>
            {saving ? 'Создание...' : 'Создать запись'}
          </Button>
        </div>
      </Section>
    </form>
  );
}
