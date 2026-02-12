# Настройка Google Calendar API

## Шаг 1: Создание проекта в Google Cloud Console

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Нажмите "Select a project" → "New Project"
3. Введите название проекта (например, "Booking System")
4. Нажмите "Create"

## Шаг 2: Включение Google Calendar API

1. В меню слева выберите "APIs & Services" → "Library"
2. Найдите "Google Calendar API"
3. Нажмите на него и нажмите "Enable"

## Шаг 3: Создание OAuth 2.0 Credentials

1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "OAuth client ID"
3. Если появится предупреждение о настройке OAuth consent screen:
   - Нажмите "Configure Consent Screen"
   - Выберите "External" (если не используете Google Workspace)
   - Заполните обязательные поля:
     - App name: "Booking System"
     - User support email: ваш email
     - Developer contact: ваш email
   - Нажмите "Save and Continue"
   - На странице "Scopes" нажмите "Add or Remove Scopes"
   - Найдите и добавьте:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Нажмите "Save and Continue"
   - На странице "Test users" добавьте свой email
   - Нажмите "Save and Continue"

4. Вернитесь в "Credentials" и снова нажмите "Create Credentials" → "OAuth client ID"
5. Выберите "Web application"
6. Введите название (например, "Booking Bot")
7. В "Authorized redirect URIs" добавьте:
   - `http://localhost:3000/oauth/callback` (для разработки)
   - `https://your-domain.vercel.app/oauth/callback` (для продакшена)
8. Нажмите "Create"
9. Сохраните Client ID и Client Secret

## Шаг 4: Получение Refresh Token

### Вариант 1: Через OAuth Playground

1. Перейдите на [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Нажмите на иконку настроек (⚙️) справа вверху
3. Отметьте "Use your own OAuth credentials"
4. Введите ваш Client ID и Client Secret
5. В левой панели найдите "Calendar API v3"
6. Выберите:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
7. Нажмите "Authorize APIs"
8. Войдите в Google аккаунт и разрешите доступ
9. Нажмите "Exchange authorization code for tokens"
10. Скопируйте "Refresh token"

### Вариант 2: Через код (для разработчиков)

Создайте файл `get-refresh-token.js`:

\`\`\`javascript
import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import open from 'open';

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:3000/oauth/callback'
);

const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
});

const server = http.createServer(async (req, res) => {
  if (req.url.indexOf('/oauth/callback') > -1) {
    const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
    const code = qs.get('code');

    res.end('Авторизация успешна! Можете закрыть это окно.');

    const { tokens } = await oauth2Client.getToken(code);
    console.log('Refresh Token:', tokens.refresh_token);
    
    server.close();
    process.exit(0);
  }
});

server.listen(3000, () => {
  console.log('Откройте эту ссылку в браузере:');
  console.log(authUrl);
  open(authUrl);
});
\`\`\`

Запустите:
```powershell
node get-refresh-token.js
```

## Шаг 5: Создание календарей для мастеров

### Вариант 1: Через Google Calendar UI

1. Откройте [Google Calendar](https://calendar.google.com/)
2. Слева нажмите "+" рядом с "Other calendars"
3. Выберите "Create new calendar"
4. Введите название (например, "Мастер - Анна Иванова")
5. Нажмите "Create calendar"
6. Найдите созданный календарь в списке слева
7. Нажмите на три точки → "Settings and sharing"
8. Прокрутите до "Integrate calendar"
9. Скопируйте "Calendar ID" (например, `abc123@group.calendar.google.com`)
10. Сохраните этот ID - он понадобится при добавлении мастера в базу данных

### Вариант 2: Через API (автоматически)

Создайте файл `create-calendar.js`:

\`\`\`javascript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'YOUR_REDIRECT_URI'
);

oauth2Client.setCredentials({
  refresh_token: 'YOUR_REFRESH_TOKEN',
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

async function createCalendar(masterName) {
  const res = await calendar.calendars.insert({
    requestBody: {
      summary: \`Мастер - \${masterName}\`,
      timeZone: 'Europe/Moscow',
    },
  });

  console.log('Calendar ID:', res.data.id);
  return res.data.id;
}

createCalendar('Анна Иванова');
\`\`\`

## Шаг 6: Настройка прав доступа

Для каждого календаря мастера:

1. Откройте настройки календаря
2. Прокрутите до "Share with specific people"
3. Нажмите "Add people"
4. Добавьте email вашего сервисного аккаунта (если используете)
5. Выберите права "Make changes to events"
6. Нажмите "Send"

## Шаг 7: Добавление Calendar ID в базу данных

После создания календаря для мастера, обновите запись в Supabase:

\`\`\`sql
UPDATE masters
SET google_calendar_id = 'abc123@group.calendar.google.com'
WHERE name = 'Анна Иванова';
\`\`\`

## Проверка работы

Создайте тестовый файл `test-calendar.js`:

\`\`\`javascript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

async function testCalendar() {
  try {
    // Создание тестового события
    const event = {
      summary: 'Тестовая запись',
      start: {
        dateTime: '2026-02-15T10:00:00+03:00',
        timeZone: 'Europe/Moscow',
      },
      end: {
        dateTime: '2026-02-15T11:00:00+03:00',
        timeZone: 'Europe/Moscow',
      },
    };

    const res = await calendar.events.insert({
      calendarId: 'YOUR_CALENDAR_ID',
      requestBody: event,
    });

    console.log('Событие создано:', res.data.htmlLink);
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

testCalendar();
\`\`\`

Запустите:
```powershell
node test-calendar.js
```

## Troubleshooting

### Ошибка "Access Not Configured"
- Убедитесь, что Google Calendar API включен в проекте

### Ошибка "Invalid Credentials"
- Проверьте Client ID и Client Secret
- Убедитесь, что redirect URI совпадает

### Ошибка "Invalid Grant"
- Refresh token истек или недействителен
- Получите новый refresh token

### Ошибка "Insufficient Permission"
- Проверьте scopes при получении токена
- Убедитесь, что добавлены права на календарь

## Полезные ссылки

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Google Cloud Console](https://console.cloud.google.com/)
