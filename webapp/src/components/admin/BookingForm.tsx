import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useState } from 'react';
import type { Master, Service } from '../../../../shared/types';
import { backButtonStyle, inputStyle } from '../../components/AppTheme';
import { supabase } from '../../services/supabase';
import { AdminCard, AdminPrimaryButton } from './AdminTheme';

interface Props {
  onClose: () => void;
}

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  color: 'var(--app-text)',
} as const;

const hintStyle = {
  fontSize: '12px',
  color: 'var(--app-text-soft)',
  marginTop: '8px',
} as const;

export function BookingForm({ onClose }: Props) {
  const [masters, setMasters] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingHour, setBookingHour] = useState('');
  const [bookingMinute, setBookingMinute] = useState('00');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMasters();
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedMasterId && bookingDate) {
      updateAvailableHours();
      loadBookedSlots();
    }
  }, [selectedMasterId, bookingDate]);

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

  async function loadBookedSlots() {
    if (!selectedMasterId || !bookingDate) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_time')
        .eq('master_id', selectedMasterId)
        .eq('booking_date', bookingDate)
        .in('status', ['active', 'pending']);

      if (error) throw error;

      const slots = new Set<string>();
      for (const booking of data || []) {
        const time = booking.booking_time.substring(0, 5);
        slots.add(time);
      }

      setBookedSlots(slots);
    } catch (error) {
      console.error('Ошибка загрузки занятых слотов:', error);
    }
  }

  function updateAvailableHours() {
    const master = masters.find((item) => item.id === selectedMasterId);
    if (!master || !master.work_schedule || !bookingDate) {
      setAvailableHours([]);
      return;
    }

    const date = new Date(bookingDate);
    const dayOfWeek = date.getDay();
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const;
    const dayName = dayNames[dayOfWeek];

    const schedule = master.work_schedule[dayName];
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      setAvailableHours([]);
      return;
    }

    const [startTime, endTime] = schedule[0].split('-');
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);

    const hours: string[] = [];
    for (let hour = startHour; hour < endHour; hour += 1) {
      hours.push(hour.toString().padStart(2, '0'));
    }

    setAvailableHours(hours);
  }

  function isTimeSlotBooked(hour: string, minute: string): boolean {
    return bookedSlots.has(`${hour}:${minute}`);
  }

  function getAvailableMinutes(): Array<{ value: string; label: string; disabled: boolean }> {
    const minutes = [
      { value: '00', label: '00 мин' },
      { value: '15', label: '15 мин' },
      { value: '30', label: '30 мин' },
      { value: '45', label: '45 мин' },
    ];

    if (!bookingHour) {
      return minutes.map((item) => ({ ...item, disabled: false }));
    }

    return minutes.map((item) => ({
      ...item,
      disabled: isTimeSlotBooked(bookingHour, item.value),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedMasterId || !selectedServiceId || !clientName || !bookingDate || !bookingHour) {
      alert('Заполните все обязательные поля');
      return;
    }

    const bookingTime = `${bookingHour}:${bookingMinute}`;

    if (isTimeSlotBooked(bookingHour, bookingMinute)) {
      alert('Это время уже занято. Выберите другое время.');
      return;
    }

    setSaving(true);

    try {
      const service = services.find((item) => item.id === selectedServiceId);
      if (!service) {
        alert('Услуга не найдена');
        return;
      }

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

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_telegram_id: 0,
          client_name: clientName,
          client_username: null,
          client_id: clientId,
          master_id: selectedMasterId,
          service_id: selectedServiceId,
          booking_date: bookingDate,
          booking_time: `${bookingTime}:00`,
          status: 'active',
          source: 'manual',
          original_price: service.price,
          discount_amount: 0,
          final_price: service.price,
          promo_code: null,
          admin_notes: notes || null,
          google_event_id: null,
        })
        .select()
        .single();

      if (bookingError) {
        if (bookingError.code === '23505') {
          alert('Мастер уже занят в это время. Выберите другое время или другого мастера.');
          return;
        }
        throw bookingError;
      }

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

  const selectStyle = {
    ...inputStyle,
    appearance: 'none' as const,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <button
        type="button"
        onClick={onClose}
        style={{
          ...backButtonStyle,
          alignSelf: 'flex-start',
          background: 'none',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        ← Назад к списку
      </button>

      <AdminCard style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Text style={{ fontSize: '28px', fontWeight: 700, color: 'var(--app-text)' }}>
            Новая запись (вручную)
          </Text>

          <div>
            <label htmlFor="master" style={labelStyle}>
              Мастер *
            </label>
            <select
              id="master"
              value={selectedMasterId}
              onChange={(e) => setSelectedMasterId(e.target.value)}
              required
              style={selectStyle}
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
            <label htmlFor="service" style={labelStyle}>
              Услуга *
            </label>
            <select
              id="service"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
              style={selectStyle}
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
            <label htmlFor="client-name" style={labelStyle}>
              Имя клиента *
            </label>
            <input
              id="client-name"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Иван Иванов"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label htmlFor="client-phone" style={labelStyle}>
              Телефон клиента
            </label>
            <input
              id="client-phone"
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="booking-date" style={labelStyle}>
              Дата записи *
            </label>
            <input
              id="booking-date"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label htmlFor="booking-hour" style={labelStyle}>
              Время записи *
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                id="booking-hour"
                value={bookingHour}
                onChange={(e) => {
                  setBookingHour(e.target.value);
                  setBookingMinute('00');
                }}
                required
                disabled={!selectedMasterId || !bookingDate}
                style={{ ...selectStyle, flex: 1 }}
              >
                <option value="">Час</option>
                {availableHours.map((hour) => {
                  const hasAvailableSlot = ['00', '15', '30', '45'].some(
                    (minute) => !isTimeSlotBooked(hour, minute),
                  );
                  return (
                    <option key={hour} value={hour} disabled={!hasAvailableSlot}>
                      {hour}:00 {!hasAvailableSlot ? '(занято)' : ''}
                    </option>
                  );
                })}
              </select>

              <select
                id="booking-minute"
                value={bookingMinute}
                onChange={(e) => setBookingMinute(e.target.value)}
                required
                disabled={!bookingHour}
                style={{ ...selectStyle, flex: 1 }}
              >
                {getAvailableMinutes().map((minute) => (
                  <option key={minute.value} value={minute.value} disabled={minute.disabled}>
                    {minute.label} {minute.disabled ? '(занято)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {!selectedMasterId && <p style={hintStyle}>Сначала выберите мастера</p>}
            {selectedMasterId && !bookingDate && <p style={hintStyle}>Сначала выберите дату</p>}
            {selectedMasterId && bookingDate && availableHours.length === 0 && (
              <p style={{ ...hintStyle, color: 'var(--app-danger)' }}>
                Мастер не работает в этот день
              </p>
            )}
            {bookingHour && bookingMinute && isTimeSlotBooked(bookingHour, bookingMinute) && (
              <p style={{ ...hintStyle, color: 'var(--app-danger)' }}>Это время уже занято</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" style={labelStyle}>
              Заметки
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация о клиенте или записи"
              rows={3}
              style={{ ...inputStyle, minHeight: '108px', resize: 'vertical' }}
            />
          </div>
        </div>
      </AdminCard>

      <AdminPrimaryButton type="submit" stretched disabled={saving}>
        {saving ? 'Создание...' : 'Создать запись'}
      </AdminPrimaryButton>
    </form>
  );
}
