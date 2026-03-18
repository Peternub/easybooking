import { createClient } from '@supabase/supabase-js';
import type {
  Booking,
  BookingReadable,
  BookingWithDetails,
  ClientWithStats,
  Master,
  MasterAbsence,
  MasterSchedule,
  Review,
  Service,
} from '../../../shared/types.js';
import { config, hasPostgresConfig, hasSupabaseConfig } from '../config.js';
import {
  cancelBookingPg,
  completeBookingPg,
  createBookingPg,
  createMasterAbsencePg,
  createMasterPg,
  createServicePg,
  createReviewPg,
  getAdminBookingsPg,
  getAdminClientsPg,
  getAdminReviewsPg,
  deleteMasterAbsencePg,
  addServiceToMasterPg,
  getAdminMastersPg,
  getAdminServicesPg,
  getBookingByIdPg,
  getBookingsForDateRangePg,
  getBookedTimesForDatePg,
  getClientBookingsPg,
  getMasterByIdPg,
  getMasterWorkSchedulePg,
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
  removeServiceFromMasterPg,
  toggleMasterActivePg,
  toggleServiceActivePg,
  updateMasterPg,
  updateMasterWorkSchedulePg,
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
type MasterAbsencePayload = Pick<MasterAbsence, 'start_date' | 'end_date' | 'reason' | 'notes'>;

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

export async function addServiceToMaster(masterId: string, serviceId: string) {
  if (hasPostgresConfig()) {
    return addServiceToMasterPg(masterId, serviceId);
  }

  const client = requireSupabaseClient();
  const { error } = await client.from('master_services').insert({
    master_id: masterId,
    service_id: serviceId,
  });

  if (error) throw error;
}

export async function removeServiceFromMaster(masterId: string, serviceId: string) {
  if (hasPostgresConfig()) {
    return removeServiceFromMasterPg(masterId, serviceId);
  }

  const client = requireSupabaseClient();
  const { error } = await client
    .from('master_services')
    .delete()
    .eq('master_id', masterId)
    .eq('service_id', serviceId);

  if (error) throw error;
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

export async function getMasterWorkSchedule(masterId: string) {
  if (hasPostgresConfig()) {
    return getMasterWorkSchedulePg(masterId);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.from('masters').select('work_schedule').eq('id', masterId).single();

  if (error) throw error;
  return (data?.work_schedule || {}) as Master['work_schedule'];
}

export async function updateMasterWorkSchedule(
  masterId: string,
  workSchedule: Master['work_schedule'],
) {
  if (hasPostgresConfig()) {
    return updateMasterWorkSchedulePg(masterId, workSchedule);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('masters')
    .update({ work_schedule: workSchedule })
    .eq('id', masterId)
    .select()
    .single();

  if (error) throw error;
  return data as Master;
}

export async function getMasterAbsences(masterId: string) {
  if (hasPostgresConfig()) {
    return getMasterAbsencesPg(masterId);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('master_absences')
    .select('*')
    .eq('master_id', masterId);

  if (error) throw error;
  return (data || []) as MasterAbsence[];
}

export async function createMasterAbsence(masterId: string, absence: MasterAbsencePayload) {
  if (hasPostgresConfig()) {
    return createMasterAbsencePg(masterId, absence);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('master_absences')
    .insert({
      master_id: masterId,
      start_date: absence.start_date,
      end_date: absence.end_date,
      reason: absence.reason,
      notes: absence.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MasterAbsence;
}

export async function deleteMasterAbsence(absenceId: string) {
  if (hasPostgresConfig()) {
    return deleteMasterAbsencePg(absenceId);
  }

  const client = requireSupabaseClient();
  const { error } = await client.from('master_absences').delete().eq('id', absenceId);

  if (error) throw error;
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

export async function getAdminReviews() {
  if (hasPostgresConfig()) {
    return getAdminReviewsPg();
  }

  const client = requireSupabaseClient();
  const { data: reviews, error: reviewsError } = await client
    .from('reviews')
    .select('id, rating, comment, created_at, booking_id, master_id, service_id')
    .order('created_at', { ascending: false });

  if (reviewsError) {
    throw reviewsError;
  }

  const typedReviews = (reviews || []) as Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    booking_id: string;
    master_id: string;
    service_id: string;
  }>;

  if (typedReviews.length === 0) {
    return [];
  }

  const bookingIds = Array.from(new Set(typedReviews.map((review) => review.booking_id)));
  const masterIds = Array.from(new Set(typedReviews.map((review) => review.master_id)));
  const serviceIds = Array.from(new Set(typedReviews.map((review) => review.service_id)));

  const [
    { data: bookings, error: bookingsError },
    { data: masters, error: mastersError },
    { data: services, error: servicesError },
  ] = await Promise.all([
    client.from('bookings').select('id, client_phone, client_username').in('id', bookingIds),
    client.from('masters').select('id, name').in('id', masterIds),
    client.from('services').select('id, name').in('id', serviceIds),
  ]);

  if (bookingsError) {
    throw bookingsError;
  }

  if (mastersError) {
    throw mastersError;
  }

  if (servicesError) {
    throw servicesError;
  }

  const bookingsMap = new Map(
    (bookings || []).map((booking) => [
      booking.id,
      booking as { id: string; client_phone: string | null; client_username: string | null },
    ]),
  );
  const mastersMap = new Map(
    (masters || []).map((master) => [master.id, master as { id: string; name: string }]),
  );
  const servicesMap = new Map(
    (services || []).map((service) => [service.id, service as { id: string; name: string }]),
  );

  return typedReviews.map((review) => {
    const booking = bookingsMap.get(review.booking_id);
    const master = mastersMap.get(review.master_id);
    const service = servicesMap.get(review.service_id);

    return {
      ...review,
      client_phone: booking?.client_phone || null,
      client_username: booking?.client_username || null,
      master_name: master?.name || 'Мастер не найден',
      service_name: service?.name || 'Услуга не найдена',
    };
  });
}

export async function getAdminClients() {
  if (hasPostgresConfig()) {
    return getAdminClientsPg();
  }

  const client = requireSupabaseClient();
  const { data, error } = await client.from('clients').select(`
      *,
      bookings:bookings(count)
    `);

  if (error) {
    throw error;
  }

  const clientsWithStats = await Promise.all(
    ((data || []) as Array<
      ClientWithStats & {
        bookings?: { count: number }[];
      }
    >).map(async (entry) => {
      const { data: lastBooking } = await client
        .from('bookings')
        .select('booking_date')
        .eq('client_id', entry.id)
        .order('booking_date', { ascending: false })
        .limit(1)
        .single();

      return {
        ...entry,
        total_bookings: entry.bookings?.[0]?.count || 0,
        completed_bookings: entry.completed_bookings || 0,
        cancelled_bookings: entry.cancelled_bookings || 0,
        total_spent: entry.total_spent || 0,
        last_visit: lastBooking?.booking_date || null,
      };
    }),
  );

  return clientsWithStats;
}

export async function getAdminBookings(
  fromDate: string,
  toDate: string,
  statuses: Booking['status'][] = ['active', 'pending'],
) {
  if (hasPostgresConfig()) {
    return getAdminBookingsPg(fromDate, toDate, statuses);
  }

  const client = requireSupabaseClient();
  const { data, error } = await client
    .from('bookings_readable')
    .select('*')
    .gte('booking_date', fromDate)
    .lte('booking_date', toDate)
    .in('status', statuses)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as BookingReadable[];
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
