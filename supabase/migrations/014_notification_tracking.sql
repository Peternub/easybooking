-- Отметки отправки уведомлений и запросов на отзыв

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_1h_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS review_request_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings.reminder_24h_sent_at IS 'Когда отправлено напоминание за 24 часа';
COMMENT ON COLUMN bookings.reminder_1h_sent_at IS 'Когда отправлено напоминание за 1 час';
COMMENT ON COLUMN bookings.review_request_sent_at IS 'Когда отправлен запрос на отзыв';
