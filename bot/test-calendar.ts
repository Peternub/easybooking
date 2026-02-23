// Тестовый скрипт для проверки Google Calendar API

import { google } from 'googleapis';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

async function testCalendar() {
  try {
    console.log('🔍 Загрузка Service Account...');
    const serviceAccountPath = join(process.cwd(), 'google-service-account.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
    
    console.log('📧 Service Account:', serviceAccount.client_email);
    
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    
    const calendar = google.calendar({ version: 'v3', auth });
    
    console.log('\n📋 Получение списка календарей...');
    
    // Попробуем получить список календарей
    const calendarList = await calendar.calendarList.list();
    
    console.log('\n✅ Доступные календари:');
    if (calendarList.data.items && calendarList.data.items.length > 0) {
      for (const cal of calendarList.data.items) {
        console.log(`  - ${cal.summary}: ${cal.id}`);
      }
    } else {
      console.log('  ❌ Нет доступных календарей!');
      console.log('  ℹ️ Service Account не имеет доступа ни к одному календарю');
    }
    
    // Попробуем создать событие в основном календаре Service Account
    const testCalendarId = serviceAccount.client_email;
    
    console.log(`\n🧪 Тест создания события в собственном календаре Service Account: ${testCalendarId}`);
    
    const event = {
      summary: 'Тестовое событие',
      description: 'Тест от EasyBooking',
      start: {
        dateTime: '2026-02-25T10:00:00',
        timeZone: 'Europe/Moscow',
      },
      end: {
        dateTime: '2026-02-25T11:00:00',
        timeZone: 'Europe/Moscow',
      },
    };
    
    const response = await calendar.events.insert({
      calendarId: testCalendarId,
      requestBody: event,
    });
    
    console.log('✅ Событие успешно создано!');
    console.log('Event ID:', response.data.id);
    console.log('Event Link:', response.data.htmlLink);
    
  } catch (error: any) {
    console.error('\n❌ Ошибка:', error.message);
    if (error.code) {
      console.error('Код ошибки:', error.code);
    }
    if (error.errors) {
      console.error('Детали:', error.errors);
    }
  }
}

testCalendar();
