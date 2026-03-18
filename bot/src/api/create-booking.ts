import type { Bot } from 'grammy';
import { handleNotifyBooking } from './notify-booking.js';
import { createBooking, getMasterById, getServiceById } from '../services/supabase.js';
import { validatePromoCode } from '../services/promo-codes.js';

interface CreateBookingRequest {
  clientTelegramId: number;
  clientName: string;
  clientPhone: string;
  clientUsername: string | null;
  masterId: string;
  serviceId: string;
  bookingDate: string;
  bookingTime: string;
  promoCode?: string;
}

export async function handleCreateBooking(bot: Bot, data: CreateBookingRequest) {
  const [master, service] = await Promise.all([
    getMasterById(data.masterId),
    getServiceById(data.serviceId),
  ]);

  let promoCode: string | null = null;
  let discountPercent = 0;

  if (data.promoCode?.trim()) {
    const promo = await validatePromoCode(data.promoCode.trim(), data.clientTelegramId);

    if (!promo) {
      return { success: false, message: 'Промокод недействителен или истёк срок действия' };
    }

    promoCode = promo.code;
    discountPercent = promo.discount_percent || 0;
  }

  const originalPrice = service.price;
  const discountAmount = Math.round((originalPrice * discountPercent) / 100);
  const finalPrice = originalPrice - discountAmount;

  const booking = await createBooking({
    client_telegram_id: data.clientTelegramId,
    client_name: data.clientName.trim(),
    client_phone: data.clientPhone.trim(),
    client_username: data.clientUsername || null,
    client_id: null,
    master_id: data.masterId,
    service_id: data.serviceId,
    booking_date: data.bookingDate,
    booking_time: data.bookingTime,
    status: 'active',
    source: 'online',
    cancellation_reason: null,
    google_event_id: null,
    original_price: originalPrice,
    discount_amount: discountAmount,
    final_price: finalPrice,
    promo_code: promoCode,
    admin_notes: null,
    reminder_24h_sent_at: null,
    reminder_1h_sent_at: null,
    review_request_sent_at: null,
  });

  await handleNotifyBooking(bot, {
    bookingId: booking.id,
    clientTelegramId: data.clientTelegramId,
    clientName: data.clientName.trim(),
    clientUsername: data.clientUsername || null,
    masterId: master.id,
    serviceId: service.id,
    bookingDate: data.bookingDate,
    bookingTime: data.bookingTime,
    originalPrice,
    discountAmount,
    finalPrice,
    promoCode: promoCode || undefined,
  });

  return {
    success: true,
    bookingId: booking.id,
    finalPrice,
  };
}
