import { config } from '../config.js';
import { createManualBooking, getMasterById, getServiceById } from '../services/data.js';
import { isDateTimeInPast } from '../utils/timezone.js';

interface CreateAdminBookingRequest {
  clientName: string;
  clientPhone?: string | null;
  masterId: string;
  serviceId: string;
  bookingDate: string;
  bookingTime: string;
  notes?: string | null;
  source?: 'manual' | 'phone' | 'walk_in';
}

export async function handleCreateAdminBooking(data: CreateAdminBookingRequest) {
  const clientName = data.clientName?.trim() || '';
  const bookingDate = data.bookingDate?.trim() || '';
  const bookingTime = data.bookingTime?.trim() || '';

  if (!clientName || !data.masterId || !data.serviceId || !bookingDate || !bookingTime) {
    return {
      success: false,
      status: 400,
      message: 'Заполните все обязательные поля',
    };
  }

  if (isDateTimeInPast(bookingDate, bookingTime, config.app.timezone)) {
    return {
      success: false,
      status: 400,
      message: 'Нельзя создать запись на прошедшее время',
    };
  }

  await Promise.all([
    getMasterById(data.masterId),
    getServiceById(data.serviceId),
  ]);

  try {
    const booking = await createManualBooking({
      client_name: clientName,
      client_phone: data.clientPhone?.trim() || null,
      master_id: data.masterId,
      service_id: data.serviceId,
      booking_date: bookingDate,
      booking_time: bookingTime,
      admin_notes: data.notes?.trim() || null,
      source: data.source || 'manual',
    });

    return {
      success: true,
      status: 200,
      bookingId: booking.id,
    };
  } catch (error) {
    const maybeError = error as { code?: string };

    if (maybeError.code === '23505') {
      return {
        success: false,
        status: 409,
        message: 'Мастер уже занят в это время. Выберите другой слот.',
      };
    }

    throw error;
  }
}
