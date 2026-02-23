// Скрипт для получения OAuth Refresh Token

import { google } from 'googleapis';
import * as http from 'node:http';
import { URL } from 'node:url';

const CLIENT_ID = '1004831850395-ievgjl25uq613deeej20k3291ueeeg.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/oauth/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

async function getToken() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Заставляет Google выдать refresh token
  });

  console.log('🔐 Авторизация Google Calendar\n');
  console.log('🌐 Запускаю локальный сервер на http://localhost:3000\n');
  console.log('📋 Открой эту ссылку в браузере:\n');
  console.log(authUrl + '\n');
  console.log('После авторизации вернись сюда...\n');

  // Создаём локальный сервер для получения кода
  const server = http.createServer(async (req, res) => {
    if (req.url?.startsWith('/oauth/callback')) {
      const url = new URL(req.url, 'http://localhost:3000');
      const code = url.searchParams.get('code');

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>✅ Успешно!</h1><p>Можешь закрыть эту вкладку и вернуться в терминал.</p>');

        try {
          const { tokens } = await oauth2Client.getToken(code);
          
          console.log('\n✅ Успешно! Сохрани эти данные в bot/.env:\n');
          console.log('GOOGLE_CLIENT_ID=' + CLIENT_ID);
          console.log('GOOGLE_CLIENT_SECRET=' + CLIENT_SECRET);
          console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
          console.log('\n📝 Refresh Token:', tokens.refresh_token);
          
          server.close();
          process.exit(0);
        } catch (error) {
          console.error('❌ Ошибка получения токена:', error);
          server.close();
          process.exit(1);
        }
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>❌ Ошибка</h1><p>Код не получен</p>');
        server.close();
        process.exit(1);
      }
    }
  });

  server.listen(3000, () => {
    console.log('✅ Сервер запущен. Жду авторизации...\n');
  });
}

getToken();
