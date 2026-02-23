// Сервис для работы с Google Calendar API

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';
import type { Booking, Master } from '../../../shared/types.js';
import { config } from '../config.js';

// Используем Service Account вместо OAuth
let auth: ReturnType<typeof google.auth.GoogleAuth> | undefined;
let calendar: calendar_v3.Calendar | undefined;

try {
  const serviceAccountPath = join(process.cwd(), 'google-service-account.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

  auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  calendar = google.calendar({ version: 'v3', auth });

  console.log('🔑 Google Calendar Service Account загружен');
  console.log('📧 Service Account:', serviceAccount.client_email);
} catch (error) {
  console.error('❌ Ошибка загрузки Service Account:', error);
  console.warn('⚠️ Google Calendar не будет работать');
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

// Создать событие в календаре
export async function createCalendarEvent(
  calendarId: string,
  booking: Booking,
  serviceDuration: number,
  masterName: string,
): Promise<string> {
  try {
    // Формат: 2026-02-21T14:00:00
    const startDateTime = `${booking.booking_date}T${booking.booking_time}:00`;

    // Вычисляем время окончания
    const startDate = new Date(`${booking.booking_date}T${booking.booking_time}:00`);
    const endDate = new Date(startDate.getTime() + serviceDuration * 60 * 1000);

    // Форматируем время окончания в локальном формате
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const day = String(endDate.getDate()).padStart(2, '0');
    const hours = String(endDate.getHours()).padStart(2, '0');
    const minutes = String(endDate.getMinutes()).padStart(2, '0');
    const seconds = String(endDate.getSeconds()).padStart(2, '0');
    const endDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    // Цвета для разных мастеров
    // Google Calendar color IDs: https://developers.google.com/calendar/api/v3/reference/colors
    const masterColors: Record<string, string> = {
      'Анна Иванова': '9', // Синий
      'Мария Петрова': '10', // Зелёный
      'Елена Сидорова': '11', // Красный
    };

    const event: CalendarEvent = {
      summary: `${masterName}: ${booking.client_name}`,
      description: `Мастер: ${masterName}\nКлиент: ${booking.client_name}\nTelegram: @${booking.client_username || 'не указан'}`,
      start: {
        dateTime: startDateTime,
        timeZone: config.app.timezone,
      },
      end: {
        dateTime: endDateTime,
        timeZone: config.app.timezone,
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    // Устанавливаем цвет события после создания
    if (response.data.id && masterColors[masterName]) {
      await calendar.events.patch({
        calendarId,
        eventId: response.data.id,
        requestBody: {
          colorId: masterColors[masterName],
        },
      });
    }

    return response.data.id || '';
  } catch (error) {
    console.error('Ошибка создания события в календаре:', error);
    throw new Error('Не удалось создать событие в Google Calendar');
  }
}

// Удалить событие из календаря
export async function deleteCalendarEvent(calendarId: string, eventId: string): Promise<void> {
  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    console.error('Ошибка удаления события из календаря:', error);
    throw new Error('Не удалось удалить событие из Google Calendar');
  }
}

// Получить занятые слоты на дату
export async function getBusySlots(
  calendarId: string,
  date: string,
): Promise<Array<{ start: string; end: string }>> {
  try {
    const timeMin = `${date}T00:00:00`;
    const timeMax = `${date}T23:59:59`;

    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      timeZone: config.app.timezone,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    return events
      .filter((event) => event.start?.dateTime && event.end?.dateTime)
      .map((event) => ({
        start: event.start?.dateTime as string,
        end: event.end?.dateTime as string,
      }));
  } catch (error) {
    console.error('Ошибка получения занятых слотов:', error);
    // Возвращаем пустой массив в случае ошибки (fallback)
    return [];
  }
}

// Проверить доступность слота
export async function isSlotAvailable(
  calendarId: string,
  date: string,
  time: string,
  durationMinutes: number,
): Promise<boolean> {
  try {
    const busySlots = await getBusySlots(calendarId, date);
    const slotStart = new Date(`${date}T${time}`);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

    // Проверяем пересечения
    for (const busy of busySlots) {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);

      // Есть пересечение если:
      // слот начинается до окончания занятого времени И
      // слот заканчивается после начала занятого времени
      if (slotStart < busyEnd && slotEnd > busyStart) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Ошибка проверки доступности слота:', error);
    // В случае ошибки считаем слот недоступным (безопасный подход)
    return false;
  }
}
