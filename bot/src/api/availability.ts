import { addDays, format, isPast, parse, startOfDay } from 'date-fns';
import { getBookedTimesForDate, getMasterAbsences, getMasterById } from '../services/data.js';

interface AbsenceRange {
  start_date: string;
  end_date: string;
}

function isDateInsideAbsence(date: string, absences: AbsenceRange[]) {
  return absences.some((absence) => {
    const checkDate = new Date(date);
    const startDate = new Date(absence.start_date);
    const endDate = new Date(absence.end_date);
    return checkDate >= startDate && checkDate <= endDate;
  });
}

export async function getAvailableDates(masterId: string) {
  const dates: string[] = [];
  const today = startOfDay(new Date());

  for (let index = 0; index < 14; index++) {
    const date = addDays(today, index);
    dates.push(format(date, 'yyyy-MM-dd'));
  }

  const absences = await getMasterAbsences(masterId);
  return dates.filter((date) => !isDateInsideAbsence(date, absences));
}

export async function getAvailableSlots(masterId: string, date: string) {
  const master = await getMasterById(masterId);
  const dateObj = new Date(date);
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
    const slotDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
    const isBooked = bookedTimes.has(time);
    const isTimePast = isPast(slotDateTime);

    return {
      time,
      isAvailable: !isBooked && !isTimePast,
      isPast: isTimePast,
    };
  });
}
