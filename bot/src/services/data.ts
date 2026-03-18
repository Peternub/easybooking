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
import {
  addServiceToMasterPg,
  cancelBookingPg,
  completeBookingPg,
  createBookingPg,
  createManualBookingPg,
  createMasterAbsencePg,
  createMasterPg,
  createServicePg,
  createReviewPg,
  deleteMasterAbsencePg,
  getAdminBookingsPg,
  getAdminClientsPg,
  getAdminMastersPg,
  getAdminReviewsPg,
  getAdminServicesPg,
  getBookedTimesForDatePg,
  getBookingByIdPg,
  getBookingsForDateRangePg,
  getClientBookingsPg,
  getMasterAbsencesPg,
  getMasterByIdPg,
  getMasterWorkSchedulePg,
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

type ServicePayload = Pick<
  Service,
  'name' | 'description' | 'price' | 'duration_minutes' | 'category' | 'is_active'
>;

type MasterPayload = Pick<
  Master,
  'name' | 'description' | 'phone' | 'photo_url' | 'is_active'
>;

type ManualBookingPayload = {
  client_name: string;
  client_phone: string | null;
  master_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  admin_notes: string | null;
  source?: Booking['source'];
};

type MasterAbsencePayload = Pick<MasterAbsence, 'start_date' | 'end_date' | 'reason' | 'notes'>;

const scheduleOrder = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export async function getMasters() {
  return getMastersPg();
}

export async function getMasterById(id: string) {
  return getMasterByIdPg(id);
}

export async function getServiceById(id: string) {
  return getServiceByIdPg(id);
}

export async function getServices() {
  return getServicesPg();
}

export async function getAdminMasters() {
  return getAdminMastersPg();
}

export async function createMaster(master: MasterPayload) {
  return createMasterPg(master);
}

export async function updateMaster(masterId: string, master: MasterPayload) {
  return updateMasterPg(masterId, master);
}

export async function toggleMasterActive(masterId: string, isActive: boolean) {
  return toggleMasterActivePg(masterId, isActive);
}

export async function getAdminServices() {
  return getAdminServicesPg();
}

export async function createService(service: ServicePayload) {
  return createServicePg(service);
}

export async function updateService(serviceId: string, service: ServicePayload) {
  return updateServicePg(serviceId, service);
}

export async function toggleServiceActive(serviceId: string, isActive: boolean) {
  return toggleServiceActivePg(serviceId, isActive);
}

export async function getServicesByMaster(masterId: string) {
  return getServicesByMasterPg(masterId);
}

export async function addServiceToMaster(masterId: string, serviceId: string) {
  return addServiceToMasterPg(masterId, serviceId);
}

export async function removeServiceFromMaster(masterId: string, serviceId: string) {
  return removeServiceFromMasterPg(masterId, serviceId);
}

export async function getMastersByService(serviceId: string) {
  return getMastersByServicePg(serviceId);
}

export async function getMasterSchedule(masterId: string): Promise<MasterSchedule[]> {
  const workSchedule = await getMasterWorkSchedulePg(masterId);

  return scheduleOrder.flatMap((dayName, index) => {
    const intervals = workSchedule[dayName] || [];

    return intervals
      .map((interval, intervalIndex) => {
        const [start_time, end_time] = interval.split('-');

        if (!start_time || !end_time) {
          return null;
        }

        return {
          id: `${masterId}-${dayName}-${intervalIndex}`,
          master_id: masterId,
          day_of_week: index,
          start_time,
          end_time,
          is_working: true,
        } satisfies MasterSchedule;
      })
      .filter(Boolean) as MasterSchedule[];
  });
}

export async function getMasterWorkSchedule(masterId: string) {
  return getMasterWorkSchedulePg(masterId);
}

export async function updateMasterWorkSchedule(
  masterId: string,
  workSchedule: Master['work_schedule'],
) {
  return updateMasterWorkSchedulePg(masterId, workSchedule);
}

export async function getMasterAbsences(masterId: string) {
  return getMasterAbsencesPg(masterId);
}

export async function createMasterAbsence(masterId: string, absence: MasterAbsencePayload) {
  return createMasterAbsencePg(masterId, absence);
}

export async function deleteMasterAbsence(absenceId: string) {
  return deleteMasterAbsencePg(absenceId);
}

export async function getBookedTimesForDate(masterId: string, date: string) {
  return getBookedTimesForDatePg(masterId, date);
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) {
  return createBookingPg(booking);
}

export async function createManualBooking(data: ManualBookingPayload) {
  return createManualBookingPg(data);
}

export async function getBookingById(id: string): Promise<BookingWithDetails> {
  return getBookingByIdPg(id);
}

export async function getClientBookings(telegramId: number) {
  return getClientBookingsPg(telegramId);
}

export async function getUpcomingBookings(hoursAhead: number) {
  return getUpcomingBookingsPg(hoursAhead);
}

export async function getBookingsForDateRange(
  fromDate: string,
  toDate: string,
  statuses: string[] = ['active'],
) {
  return getBookingsForDateRangePg(fromDate, toDate, statuses);
}

export async function markBookingNotificationSent(
  bookingId: string,
  type: 'reminder_24h' | 'reminder_1h' | 'review_request',
) {
  return markBookingNotificationSentPg(bookingId, type);
}

export async function cancelBooking(id: string, cancelledBy: 'client' | 'admin', reason?: string) {
  void cancelledBy;
  return cancelBookingPg(id, reason);
}

export async function completeBooking(id: string) {
  return completeBookingPg(id);
}

export async function createReview(review: Omit<Review, 'id' | 'created_at'>) {
  return createReviewPg(review);
}

export async function getAdminReviews() {
  return getAdminReviewsPg();
}

export async function getAdminClients(): Promise<ClientWithStats[]> {
  return getAdminClientsPg();
}

export async function getAdminBookings(
  fromDate: string,
  toDate: string,
  statuses: Booking['status'][] = ['active', 'pending'],
): Promise<BookingReadable[]> {
  return getAdminBookingsPg(fromDate, toDate, statuses);
}

export async function hasReview(bookingId: string) {
  return hasReviewPg(bookingId);
}

export async function isAdmin(telegramId: number) {
  return isAdminPg(telegramId);
}
