import { addDays, format, parse } from 'date-fns';
import { config } from '../config.js';
import { getBookedTimesForDate, getMasterAbsences, getMasterById } from '../services/data.js';
import { getCurrentDateInTimezone, isDateTimeInPast } from '../utils/timezone.js';

interface AbsenceRange {
  start_date: string;
  end_date: string;
}

function isDateInsideAbsence(date: string, absences: AbsenceRange[]) {
  return absences.some((absence) => date >= absence.start_date && date <= absence.end_date);
}

export async function getAvailableDates(masterId: string) {
  const dates: string[] = [];
  const today = parse(getCurrentDateInTimezone(config.app.timezone), 'yyyy-MM-dd', new Date());

  for (let index = 0; index < 14; index++) {
    const date = addDays(today, index);
    dates.push(format(date, 'yyyy-MM-dd'));
  }

  const absences = await getMasterAbsences(masterId);
  return dates.filter((date) => !isDateInsideAbsence(date, absences));
}

export async function getAvailableSlots(masterId: string, date: string) {
  const master = await getMasterById(masterId);
  const dateObj = parse(date, 'yyyy-MM-dd', new Date());
  const dayOfWeek = dateObj.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek] as keyof typeof master.work_schedule;
  const daySchedule = master.work_schedule?.[dayName] || [];

  if (daySchedule.length === 0) {
    return [];
  }

  const allSlots: string[] = [];

  for (const timeRange of daySchedule) {
    const [startTime, endTime] = timeRange.split('-');
    if (!startTime || !endTime) {
      continue;
    }

    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
  }

  const bookedTimes = new Set(await getBookedTimesForDate(masterId, date));

  return allSlots.map((time) => {
    const isBooked = bookedTimes.has(time);
    const isTimePast = isDateTimeInPast(date, time, config.app.timezone);

    return {
      time,
      isAvailable: !isBooked && !isTimePast,
      isPast: isTimePast,
    };
  });
}
