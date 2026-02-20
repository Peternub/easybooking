// Сервис для работы с Google Calendar API

import { google } from 'googleapis';
import type { Booking, Master } from '../../../shared/types.js';
import { config } from '../config.js';

const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri,
);

// Устанавливаем refresh token
if (config.google.refreshToken) {
  console.log('🔑 Google Calendar credentials загружены');
  console.log('Client ID:', config.google.clientId ? '✅ Есть' : '❌ Отсутствует');
  console.log('Client Secret:', config.google.clientSecret ? '✅ Есть' : '❌ Отсутствует');
  console.log('Refresh Token:', config.google.refreshToken ? '✅ Есть' : '❌ Отсутствует');
  
  oauth2Client.setCredentials({
    refresh_token: config.google.refreshToken,
  });
} else {
  console.warn('⚠️ Google Calendar не настроен - refresh token отсутствует');
}

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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
): Promise<string> {
  try {
    const startDateTime = `${booking.booking_date}T${booking.booking_time}`;
    const endDateTime = new Date(
      new Date(startDateTime).getTime() + serviceDuration * 60 * 1000,
    ).toISOString();

    const event: CalendarEvent = {
      summary: `Запись: ${booking.client_name}`,
      description: `Клиент: ${booking.client_name}\nTelegram: @${booking.client_username || 'не указан'}`,
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
        start: event.start?.dateTime!,
        end: event.end?.dateTime!,
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
