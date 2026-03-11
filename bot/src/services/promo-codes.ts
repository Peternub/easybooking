// Сервис для работы с промокодами

import { supabase } from './supabase.js';

// Генерация уникального промокода
export function generatePromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'COMEBACK';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Создать промокод для клиента
export async function createPromoCode(
  clientTelegramId: number,
  discountPercent: number,
  validDays = 7,
) {
  const code = generatePromoCode();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validDays);

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

// Проверить промокод
export async function validatePromoCode(code: string, clientTelegramId: number) {
  const upperCode = code.toUpperCase();
  
  // Сначала проверяем многоразовые промокоды
  const { data: reusablePromo, error: reusableError } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', upperCode)
    .eq('is_reusable', true)
    .gte('valid_until', new Date().toISOString())
    .single();

  if (reusablePromo && !reusableError) {
    // Проверяем лимит использований
    if (reusablePromo.usage_limit && reusablePromo.usage_count >= reusablePromo.usage_limit) {
      return null;
    }
    return reusablePromo;
  }

  // Если не нашли многоразовый, проверяем одноразовый для конкретного клиента
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

// Использовать промокод
export async function usePromoCode(code: string, bookingId: string) {
  const upperCode = code.toUpperCase();
  
  // Получаем промокод
  const { data: promo } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', upperCode)
    .single();

  if (!promo) {
    throw new Error('Промокод не найден');
  }

  // Если многоразовый - увеличиваем счётчик
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

  // Если одноразовый - помечаем как использованный
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

// Получить неактивных клиентов (60+ дней без записи)
export async function getInactiveClients(daysInactive = 60) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  // Получаем всех клиентов с их последней записью
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('client_telegram_id, booking_date')
    .eq('status', 'active')
    .order('booking_date', { ascending: false });

  if (error) {
    console.error('Ошибка получения записей:', error);
    return [];
  }

  // Группируем по клиентам и находим последнюю запись
  const clientLastBooking = new Map<number, string>();
  for (const booking of bookings || []) {
    if (!clientLastBooking.has(booking.client_telegram_id)) {
      clientLastBooking.set(booking.client_telegram_id, booking.booking_date);
    }
  }

  // Фильтруем неактивных клиентов
  const inactiveClients: number[] = [];
  for (const [clientId, lastBookingDate] of clientLastBooking.entries()) {
    if (new Date(lastBookingDate) < cutoffDate) {
      // Проверяем что клиенту ещё не отправляли промокод недавно
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
