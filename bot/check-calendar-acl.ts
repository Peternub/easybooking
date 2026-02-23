// Проверка ACL (прав доступа) календаря

import { google } from 'googleapis';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

async function checkACL() {
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
    
    const calendarId = 'petrmolcanuk@gmail.com';
    
    console.log(`\n📋 Проверка прав доступа к календарю: ${calendarId}`);
    
    // Попробуем получить информацию о календаре
    try {
      const calInfo = await calendar.calendars.get({ calendarId });
      console.log('✅ Календарь найден:', calInfo.data.summary);
    } catch (error: any) {
      console.log('❌ Не удалось получить информацию о календаре');
      console.log('Ошибка:', error.message);
    }
    
    // Попробуем получить ACL
    try {
      console.log('\n📋 Получение списка прав доступа (ACL)...');
      const acl = await calendar.acl.list({ calendarId });
      
      if (acl.data.items && acl.data.items.length > 0) {
        console.log('✅ Права доступа:');
        for (const rule of acl.data.items) {
          console.log(`  - ${rule.scope?.type}: ${rule.scope?.value} (${rule.role})`);
        }
      } else {
        console.log('❌ Нет прав доступа');
      }
    } catch (error: any) {
      console.log('❌ Не удалось получить ACL');
      console.log('Ошибка:', error.message);
      console.log('Код:', error.code);
    }
    
  } catch (error: any) {
    console.error('\n❌ Ошибка:', error.message);
  }
}

checkACL();
