import { Text } from '@telegram-apps/telegram-ui';
import { useEffect, useMemo, useState } from 'react';
import type { Master, Service } from '../../../../shared/types';
import { backButtonStyle, inputStyle } from '../../components/AppTheme';
import {
  createAdminBookingApi,
  getAdminMastersApi,
  getAdminServicesApi,
  getAvailableSlotsApi,
} from '../../services/api';
import { AdminCard, AdminPrimaryButton } from './AdminTheme';

interface Props {
  onClose?: () => void;
  initialDate?: string;
  onSaved?: () => void;
  hideBackButton?: boolean;
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

const defaultMinuteOptions = ['00', '15', '30', '45'];

export function BookingForm({ onClose, initialDate, onSaved, hideBackButton = false }: Props) {
  const [masters, setMasters] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingDate, setBookingDate] = useState(initialDate || '');
  const [bookingHour, setBookingHour] = useState('');
  const [bookingMinute, setBookingMinute] = useState('00');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<
    Array<{ time: string; isAvailable: boolean; isPast: boolean }>
  >([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (initialDate) {
      setBookingDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    if (selectedMasterId && bookingDate) {
      loadAvailableSlots(selectedMasterId, bookingDate);
      return;
    }

    setAvailableSlots([]);
    setBookingHour('');
    setBookingMinute('00');
  }, [selectedMasterId, bookingDate]);

  const availableHours = useMemo(() => {
    const hours = new Set<string>();

    for (const slot of availableSlots) {
      if (slot.isPast) {
        continue;
      }

      hours.add(slot.time.substring(0, 2));
    }

    return Array.from(hours);
  }, [availableSlots]);

  const bookedSlots = useMemo(() => {
    const slots = new Set<string>();

    for (const slot of availableSlots) {
      if (!slot.isAvailable || slot.isPast) {
        slots.add(slot.time.substring(0, 5));
      }
    }

    return slots;
  }, [availableSlots]);

  const minuteOptions = useMemo(() => {
    if (!bookingHour) {
      return defaultMinuteOptions.map((value) => ({
        value,
        label: `${value} мин`,
        disabled: false,
      }));
    }

    return defaultMinuteOptions.map((value) => ({
      value,
      label: `${value} мин`,
      disabled: bookedSlots.has(`${bookingHour}:${value}`),
    }));
  }, [bookingHour, bookedSlots]);

  useEffect(() => {
    if (!bookingHour) {
      return;
    }

    if (!availableHours.includes(bookingHour)) {
      setBookingHour('');
      setBookingMinute('00');
      return;
    }

    const selectedMinuteOption = minuteOptions.find((item) => item.value === bookingMinute);
    if (selectedMinuteOption && !selectedMinuteOption.disabled) {
      return;
    }

    const firstAvailableMinute = minuteOptions.find((item) => !item.disabled)?.value || '00';
    setBookingMinute(firstAvailableMinute);
  }, [availableHours, bookingHour, bookingMinute, minuteOptions]);

  async function loadInitialData() {
    try {
      const [mastersData, servicesData] = await Promise.all([
        getAdminMastersApi(),
        getAdminServicesApi(),
      ]);

      setMasters(mastersData.filter((master) => master.is_active));
      setServices(servicesData.filter((service) => service.is_active));
    } catch (error) {
      console.error('Ошибка загрузки данных формы записи:', error);
      alert('Не удалось загрузить данные формы');
    }
  }

  async function loadAvailableSlots(masterId: string, date: string) {
    setLoadingSlots(true);

    try {
      const slots = await getAvailableSlotsApi(masterId, date);
      setAvailableSlots(slots.filter((slot) => !slot.isPast));
    } catch (error) {
      console.error('Ошибка загрузки свободных слотов:', error);
      setAvailableSlots([]);
      alert('Не удалось загрузить свободное время');
    } finally {
      setLoadingSlots(false);
    }
  }

  function isTimeSlotBooked(hour: string, minute: string): boolean {
    return bookedSlots.has(`${hour}:${minute}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedMasterId || !selectedServiceId || !clientName || !bookingDate || !bookingHour) {
      alert('Заполните все обязательные поля');
      return;
    }

    const bookingTime = `${bookingHour}:${bookingMinute}:00`;

    if (isTimeSlotBooked(bookingHour, bookingMinute)) {
      alert('Это время уже занято. Выберите другой слот.');
      return;
    }

    setSaving(true);

    try {
      await createAdminBookingApi({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || null,
        masterId: selectedMasterId,
        serviceId: selectedServiceId,
        bookingDate,
        bookingTime,
        notes: notes.trim() || null,
        source: 'manual',
      });

      alert('Запись создана');
      onSaved?.();
      onClose?.();
    } catch (error) {
      console.error('Ошибка создания записи:', error);
      const message = error instanceof Error ? error.message : 'Не удалось создать запись';
      alert(message);
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
      {!hideBackButton && onClose && (
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
      )}

      <AdminCard style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Text style={{ fontSize: '28px', fontWeight: 700, color: 'var(--app-text)' }}>
            Новая запись
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
                disabled={!selectedMasterId || !bookingDate || loadingSlots}
                style={{ ...selectStyle, flex: 1 }}
              >
                <option value="">{loadingSlots ? 'Загрузка...' : 'Час'}</option>
                {availableHours.map((hour) => {
                  const hasAvailableSlot = defaultMinuteOptions.some(
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
                disabled={!bookingHour || loadingSlots}
                style={{ ...selectStyle, flex: 1 }}
              >
                {minuteOptions.map((minute) => (
                  <option key={minute.value} value={minute.value} disabled={minute.disabled}>
                    {minute.label} {minute.disabled ? '(занято)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {!selectedMasterId && <p style={hintStyle}>Сначала выберите мастера</p>}
            {selectedMasterId && !bookingDate && <p style={hintStyle}>Сначала выберите дату</p>}
            {selectedMasterId && bookingDate && !loadingSlots && availableHours.length === 0 && (
              <p style={{ ...hintStyle, color: 'var(--app-danger)' }}>
                У мастера нет свободных слотов на эту дату
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

      <AdminPrimaryButton type="submit" stretched disabled={saving || loadingSlots}>
        {saving ? 'Создание...' : 'Создать запись'}
      </AdminPrimaryButton>
    </form>
  );
}
