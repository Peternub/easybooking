# Booking Flow

## Route

`/`

## Назначение

Основной клиентский сценарий записи на услугу через Telegram Mini App.

## Основные компоненты

- `SelectService`
- `SelectMaster`
- `SelectDateTime`
- `BookingConfirmation`

## Поток данных

- пользователь последовательно выбирает услугу, мастера и слот;
- подтверждение записи отправляет данные в backend API;
- результат сценария сопровождается Telegram-уведомлением из backend.
