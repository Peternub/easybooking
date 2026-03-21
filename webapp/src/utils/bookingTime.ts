import type { BookingReadable } from '../../../shared/types';

export const APP_TIMEZONE = 'Europe/Moscow';

function getDateTimeParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
  };
}

export function formatDateForTimezone(date: Date, timeZone = APP_TIMEZONE) {
  return getDateTimeParts(date, timeZone).date;
}

export function normalizeBookingTime(time: string) {
  const [hours = '00', minutes = '00', seconds = '00'] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
}

function compareBookingWithNow(
  bookingDate: string,
  bookingTime: string,
  timeZone = APP_TIMEZONE,
) {
  const now = getDateTimeParts(new Date(), timeZone);
  const bookingKey = `${bookingDate}T${normalizeBookingTime(bookingTime)}`;
  const nowKey = `${now.date}T${now.time}`;

  return bookingKey.localeCompare(nowKey);
}

export function getEffectiveBookingStatus(booking: BookingReadable): BookingReadable['status'] {
  if (!['active', 'pending'].includes(booking.status)) {
    return booking.status;
  }

  return compareBookingWithNow(booking.booking_date, booking.booking_time) <= 0
    ? 'completed'
    : booking.status;
}

export function isUpcomingBooking(booking: BookingReadable) {
  if (!['active', 'pending'].includes(booking.status)) {
    return false;
  }

  return compareBookingWithNow(booking.booking_date, booking.booking_time) > 0;
}
