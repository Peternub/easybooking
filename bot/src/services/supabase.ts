// Сервис для работы с Supabase

import { createClient } from '@supabase/supabase-js';
import type {
  Booking,
  BookingWithDetails,
  Master,
  MasterSchedule,
  MasterScheduleException,
  Review,
  Service,
} from '../../../shared/types.js';
import { config } from '../config.js';

export const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// Мастера
export async function getMasters() {
  const { data, error } = await supabase
    .from('masters')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data as Master[];
}

export async function getMasterById(id: string) {
  const { data, error } = await supabase.from('masters').select('*').eq('id', id).single();

  if (error) throw error;
  return data as Master;
}

export async function getServiceById(id: string) {
  const { data, error } = await supabase.from('services').select('*').eq('id', id).single();

  if (error) throw error;
  return data as Service;
}

// Услуги
export async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Service[];
}

export async function getServicesByMaster(masterId: string) {
  const { data, error } = await supabase
    .from('master_services')
    .select('service_id, services(*)')
    .eq('master_id', masterId);

  if (error) throw error;
  return (data?.map((item: { services: Service }) => item.services).filter(Boolean) ||
    []) as Service[];
}

// График работы
export async function getMasterSchedule(masterId: string) {
  const { data, error } = await supabase
    .from('master_schedules')
    .select('*')
    .eq('master_id', masterId)
    .order('day_of_week');

  if (error) throw error;
  return data as MasterSchedule[];
}

export async function getMasterExceptions(masterId: string, fromDate: string) {
  const { data, error } = await supabase
    .from('master_schedule_exceptions')
    .select('*')
    .eq('master_id', masterId)
    .gte('date', fromDate);

  if (error) throw error;
  return data as MasterScheduleException[];
}

// Записи
export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('bookings').insert(booking).select().single();

  if (error) throw error;
  return data as Booking;
}

export async function getBookingById(id: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, master:masters(*), service:services(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as BookingWithDetails;
}

export async function getClientBookings(telegramId: number) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, master:masters(*), service:services(*)')
    .eq('client_telegram_id', telegramId)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false });

  if (error) throw error;
  return data as BookingWithDetails[];
}

export async function getUpcomingBookings(hoursAhead: number) {
  const now = new Date();
  const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('bookings')
    .select('*, master:masters(*), service:services(*)')
    .eq('status', 'active')
    .gte('booking_date', now.toISOString().split('T')[0])
    .lte('booking_date', targetTime.toISOString().split('T')[0]);

  if (error) throw error;
  return data as BookingWithDetails[];
}

export async function cancelBooking(id: string, cancelledBy: 'client' | 'admin', reason?: string) {
  const status = cancelledBy === 'client' ? 'cancelled_by_client' : 'cancelled_by_admin';

  const { data, error } = await supabase
    .from('bookings')
    .update({
      status,
      cancellation_reason: reason || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function completeBooking(id: string) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

// Отзывы
export async function createReview(review: Omit<Review, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('reviews').insert(review).select().single();

  if (error) throw error;
  return data as Review;
}

export async function hasReview(bookingId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .single();

  return !!data && !error;
}

// Проверка администратора
export async function isAdmin(telegramId: number) {
  // Проверяем по переменной окружения
  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (adminId && String(telegramId) === String(adminId)) {
    return true;
  }

  // Дополнительно проверяем таблицу admins (если она существует)
  const { data, error } = await supabase
    .from('admins')
    .select('telegram_id')
    .eq('telegram_id', telegramId)
    .single();

  return !!data && !error;
}
