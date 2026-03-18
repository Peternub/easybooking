import { createClient } from '@supabase/supabase-js';
import type {
  Booking,
  BookingWithDetails,
  Master,
  MasterSchedule,
  Review,
  Service,
} from '../../../shared/types.js';
import { config, hasPostgresConfig, hasSupabaseConfig } from '../config.js';
import {
  cancelBookingPg,
  completeBookingPg,
  createBookingPg,
  createMasterPg,
  createServicePg,
  createReviewPg,
  getAdminMastersPg,
  getAdminServicesPg,
  getBookingByIdPg,
  getBookingsForDateRangePg,
  getBookedTimesForDatePg,
  getClientBookingsPg,
  getMasterByIdPg,
  getMasterAbsencesPg,
  getMastersByServicePg,
  getMastersPg,
  getServiceByIdPg,
  getServicesByMasterPg,
  getServicesPg,
  getUpcomingBookingsPg,
  hasReviewPg,
  isAdminPg,
  markBookingNotificationSentPg,
  toggleMasterActivePg,
  toggleServiceActivePg,
  updateMasterPg,
  updateServicePg,
} from './postgres.js';

export const supabase = hasSupabaseConfig()
  ? createClient(config.supabase.url, config.supabase.serviceKey)
  : null;

export function requireSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase не настроен');
  }

  return supabase;
}

export async function getMasters() {
  if (hasPostgresConfig()) {
    return getMastersPg();
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.from('masters').select('*').eq('is_active', true).order('name');

  if (error) throw error;
  return data as Master[];
}

export async function getMasterById(id: string) {
  if (hasPostgresConfig()) {
    return getMasterByIdPg(id);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.from('masters').select('*').eq('id', id).single();

  if (error) throw error;
  return data as Master;
}

export async function getServiceById(id: string) {
  if (hasPostgresConfig()) {
    return getServiceByIdPg(id);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.from('services').select('*').eq('id', id).single();

  if (error) throw error;
  return data as Service;
}

export async function getServices() {
  if (hasPostgresConfig()) {
    return getServicesPg();
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Service[];
}

type ServicePayload = Pick<
  Service,
  'name' | 'description' | 'price' | 'duration_minutes' | 'category' | 'is_active'
>;

type MasterPayload = Pick<
  Master,
  'name' | 'description' | 'phone' | 'photo_url' | 'is_active'
>;

export async function getAdminMasters() {
  if (hasPostgresConfig()) {
    return getAdminMastersPg();
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.from('masters').select('*').order('name');

  if (error) throw error;
  return data as Master[];
}

export async function createMaster(master: MasterPayload) {
  if (hasPostgresConfig()) {
    return createMasterPg(master);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.from('masters').insert(master).select().single();

  if (error) throw error;
  return data as Master;
}

export async function updateMaster(masterId: string, master: MasterPayload) {
  if (hasPostgresConfig()) {
    return updateMasterPg(masterId, master);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.from('masters').update(master).eq('id', masterId).select().single();

  if (error) throw error;
  return data as Master;
}

export async function toggleMasterActive(masterId: string, isActive: boolean) {
  if (hasPostgresConfig()) {
    return toggleMasterActivePg(masterId, isActive);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('masters')
    .update({ is_active: isActive })
    .eq('id', masterId)
    .select()
    .single();

  if (error) throw error;
  return data as Master;
}

export async function getAdminServices() {
  if (hasPostgresConfig()) {
    return getAdminServicesPg();
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('services')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Service[];
}

export async function createService(service: ServicePayload) {
  if (hasPostgresConfig()) {
    return createServicePg(service);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.from('services').insert(service).select().single();

  if (error) throw error;
  return data as Service;
}

export async function updateService(serviceId: string, service: ServicePayload) {
  if (hasPostgresConfig()) {
    return updateServicePg(serviceId, service);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('services')
    .update(service)
    .eq('id', serviceId)
    .select()
    .single();

  if (error) throw error;
  return data as Service;
}

export async function toggleServiceActive(serviceId: string, isActive: boolean) {
  if (hasPostgresConfig()) {
    return toggleServiceActivePg(serviceId, isActive);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('services')
    .update({ is_active: isActive })
    .eq('id', serviceId)
    .select()
    .single();

  if (error) throw error;
  return data as Service;
}

export async function getServicesByMaster(masterId: string) {
  if (hasPostgresConfig()) {
    return getServicesByMasterPg(masterId);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('master_services')
    .select('service_id, services(*)')
    .eq('master_id', masterId);

  if (error) throw error;

  return (
    data
      ?.map((item: { services: Service | Service[] | null }) =>
        Array.isArray(item.services) ? item.services[0] : item.services,
      )
      .filter(Boolean) || []
  ) as Service[];
}

export async function getMastersByService(serviceId: string) {
  if (hasPostgresConfig()) {
    return getMastersByServicePg(serviceId);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('master_services')
    .select('master_id, masters(*)')
    .eq('service_id', serviceId);

  if (error) throw error;

  return (
    data
      ?.map((item: { masters: Master | Master[] | null }) =>
        Array.isArray(item.masters) ? item.masters[0] : item.masters,
      )
      .filter(Boolean) || []
  ) as Master[];
}

export async function getMasterSchedule(masterId: string) {
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('master_schedules')
    .select('*')
    .eq('master_id', masterId)
    .order('day_of_week');

  if (error) throw error;
  return data as MasterSchedule[];
}

export async function getMasterAbsences(masterId: string) {
  if (hasPostgresConfig()) {
    return getMasterAbsencesPg(masterId);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('master_absences')
    .select('start_date, end_date')
    .eq('master_id', masterId);

  if (error) throw error;
  return (data || []) as { start_date: string; end_date: string }[];
}

export async function getBookedTimesForDate(masterId: string, date: string) {
  if (hasPostgresConfig()) {
    return getBookedTimesForDatePg(masterId, date);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('bookings')
    .select('booking_time')
    .eq('master_id', masterId)
    .eq('booking_date', date)
    .in('status', ['pending', 'active', 'completed']);

  if (error) throw error;
  return (data || []).map((booking: { booking_time: string }) => booking.booking_time.substring(0, 5));
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) {
  if (hasPostgresConfig()) {
    return createBookingPg(booking);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.from('bookings').insert(booking).select().single();

  if (error) throw error;
  return data as Booking;
}

export async function getBookingById(id: string) {
  if (hasPostgresConfig()) {
    return getBookingByIdPg(id);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('bookings')
    .select('*, master:masters(*), service:services(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as BookingWithDetails;
}

export async function getClientBookings(telegramId: number) {
  if (hasPostgresConfig()) {
    return getClientBookingsPg(telegramId);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('bookings')
    .select('*, master:masters(*), service:services(*)')
    .eq('client_telegram_id', telegramId)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false });

  if (error) throw error;
  return data as BookingWithDetails[];
}

export async function getUpcomingBookings(hoursAhead: number) {
  if (hasPostgresConfig()) {
    return getUpcomingBookingsPg(hoursAhead);
  }

  const now = new Date();
  const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('bookings')
    .select('*, master:masters(*), service:services(*)')
    .eq('status', 'active')
    .gte('booking_date', now.toISOString().split('T')[0])
    .lte('booking_date', targetTime.toISOString().split('T')[0]);

  if (error) throw error;
  return data as BookingWithDetails[];
}

export async function getBookingsForDateRange(
  fromDate: string,
  toDate: string,
  statuses: string[] = ['active'],
) {
  if (hasPostgresConfig()) {
    return getBookingsForDateRangePg(fromDate, toDate, statuses);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('bookings')
    .select('*, master:masters(*), service:services(*)')
    .in('status', statuses)
    .gte('booking_date', fromDate)
    .lte('booking_date', toDate)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true });

  if (error) throw error;
  return data as BookingWithDetails[];
}

export async function markBookingNotificationSent(
  bookingId: string,
  type: 'reminder_24h' | 'reminder_1h' | 'review_request',
) {
  if (hasPostgresConfig()) {
    return markBookingNotificationSentPg(bookingId, type);
  }

  const updates =
    type === 'reminder_24h'
      ? { reminder_24h_sent_at: new Date().toISOString() }
      : type === 'reminder_1h'
        ? { reminder_1h_sent_at: new Date().toISOString() }
        : { review_request_sent_at: new Date().toISOString() };

  const client = requireSupabaseClient();
  const { error } = await client.from('bookings').update(updates).eq('id', bookingId);

  if (error) throw error;
}

export async function cancelBooking(id: string, cancelledBy: 'client' | 'admin', reason?: string) {
  if (hasPostgresConfig()) {
    return cancelBookingPg(id, reason);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('bookings')
    .update({
      status: 'cancelled',
      cancellation_reason: reason || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function completeBooking(id: string) {
  if (hasPostgresConfig()) {
    return completeBookingPg(id);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

export async function createReview(review: Omit<Review, 'id' | 'created_at'>) {
  if (hasPostgresConfig()) {
    return createReviewPg(review);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.from('reviews').insert(review).select().single();

  if (error) throw error;
  return data as Review;
}

export async function hasReview(bookingId: string) {
  if (hasPostgresConfig()) {
    return hasReviewPg(bookingId);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.from('reviews').select('id').eq('booking_id', bookingId).single();

  return !!data && !error;
}

export async function isAdmin(telegramId: number) {
  if (hasPostgresConfig()) {
    return isAdminPg(telegramId);
  }

  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (adminId && String(telegramId) === String(adminId)) {
    return true;
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('admins')
    .select('telegram_id')
    .eq('telegram_id', telegramId)
    .single();

  return !!data && !error;
}
