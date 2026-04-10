# Review Page

## Route

`/review/:bookingId`

## Назначение

Экран для отправки оценки и текстового отзыва после визита.

## Основные компоненты

- локальная форма на странице `ReviewPage`
- Telegram WebApp API для определения пользователя и закрытия окна

## Поток данных

- страница получает `bookingId` из маршрута;
- Telegram user id извлекается из `initDataUnsafe`;
- отзыв отправляется в endpoint `/api/submit-review`.
