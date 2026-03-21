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

export function normalizeTime(time: string) {
  const [hours = '00', minutes = '00', seconds = '00'] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
}

export function getCurrentDateInTimezone(timeZone: string) {
  return getDateTimeParts(new Date(), timeZone).date;
}

export function compareDateTimeWithNow(date: string, time: string, timeZone: string) {
  const now = getDateTimeParts(new Date(), timeZone);
  const bookingKey = `${date}T${normalizeTime(time)}`;
  const nowKey = `${now.date}T${now.time}`;

  return bookingKey.localeCompare(nowKey);
}

export function isDateTimeInPast(date: string, time: string, timeZone: string) {
  return compareDateTimeWithNow(date, time, timeZone) <= 0;
}

export function isDateTimeInFuture(date: string, time: string, timeZone: string) {
  return compareDateTimeWithNow(date, time, timeZone) > 0;
}
