import { hasPostgresConfig } from '../config.js';
import {
  createPromoCodePg,
  getInactiveClientsPg,
  usePromoCodePg,
  validatePromoCodePg,
} from './postgres.js';
import { requireSupabaseClient } from './supabase.js';

export function generatePromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'COMEBACK';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createPromoCode(
  clientTelegramId: number,
  discountPercent: number,
  validDays = 7,
) {
  const code = generatePromoCode();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);

  if (hasPostgresConfig()) {
    return createPromoCodePg(code, clientTelegramId, discountPercent, validUntil.toISOString());
  }

  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      code,
      client_telegram_id: clientTelegramId,
      discount_percent: discountPercent,
      valid_until: validUntil.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Ошибка создания промокода:', error);
    throw error;
  }

  return data;
}

export async function validatePromoCode(code: string, clientTelegramId: number) {
  if (hasPostgresConfig()) {
    return validatePromoCodePg(code, clientTelegramId);
  }

  const supabase = requireSupabaseClient();
  const upperCode = code.toUpperCase();

  const { data: reusablePromo, error: reusableError } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', upperCode)
    .eq('is_reusable', true)
    .gte('valid_until', new Date().toISOString())
    .single();

  if (reusablePromo && !reusableError) {
    if (reusablePromo.usage_limit && reusablePromo.usage_count >= reusablePromo.usage_limit) {
      return null;
    }

    return reusablePromo;
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', upperCode)
    .eq('client_telegram_id', clientTelegramId)
    .eq('is_used', false)
    .gte('valid_until', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function usePromoCode(code: string, bookingId: string) {
  if (hasPostgresConfig()) {
    return usePromoCodePg(code, bookingId);
  }

  const supabase = requireSupabaseClient();
  const upperCode = code.toUpperCase();
  const { data: promo } = await supabase.from('promo_codes').select('*').eq('code', upperCode).single();

  if (!promo) {
    throw new Error('Промокод не найден');
  }

  if (promo.is_reusable) {
    const { data, error } = await supabase
      .from('promo_codes')
      .update({
        usage_count: (promo.usage_count || 0) + 1,
      })
      .eq('code', upperCode)
      .select()
      .single();

    if (error) {
      console.error('Ошибка использования промокода:', error);
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from('promo_codes')
    .update({
      is_used: true,
      used_at: new Date().toISOString(),
      booking_id: bookingId,
    })
    .eq('code', upperCode)
    .select()
    .single();

  if (error) {
    console.error('Ошибка использования промокода:', error);
    throw error;
  }

  return data;
}

export async function getInactiveClients(daysInactive = 60) {
  if (hasPostgresConfig()) {
    return getInactiveClientsPg(daysInactive);
  }

  const supabase = requireSupabaseClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('client_telegram_id, booking_date')
    .eq('status', 'active')
    .order('booking_date', { ascending: false });

  if (error) {
    console.error('Ошибка получения записей:', error);
    return [];
  }

  const clientLastBooking = new Map<number, string>();
  for (const booking of bookings || []) {
    if (!clientLastBooking.has(booking.client_telegram_id)) {
      clientLastBooking.set(booking.client_telegram_id, booking.booking_date);
    }
  }

  const inactiveClients: number[] = [];
  for (const [clientId, lastBookingDate] of clientLastBooking.entries()) {
    if (new Date(lastBookingDate) < cutoffDate) {
      const { data: existingPromo } = await supabase
        .from('promo_codes')
        .select('created_at')
        .eq('client_telegram_id', clientId)
        .gte('created_at', cutoffDate.toISOString())
        .single();

      if (!existingPromo) {
        inactiveClients.push(clientId);
      }
    }
  }

  return inactiveClients;
}
