import { createReview, getBookingById, hasReview } from '../services/data.js';

interface SubmitReviewData {
  bookingId: string;
  clientTelegramId: number;
  rating: number;
  comment?: string;
}

export async function handleSubmitReview(data: SubmitReviewData) {
  const { bookingId, clientTelegramId, rating, comment } = data;

  if (!bookingId) {
    return { success: false, message: 'Не передан идентификатор записи' };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, message: 'Оценка должна быть от 1 до 5' };
  }

  const booking = await getBookingById(bookingId);

  if (booking.client_telegram_id !== clientTelegramId) {
    return { success: false, message: 'Эта запись принадлежит другому клиенту' };
  }

  if (await hasReview(bookingId)) {
    return { success: false, message: 'Отзыв по этой записи уже оставлен' };
  }

  await createReview({
    booking_id: bookingId,
    client_telegram_id: clientTelegramId,
    master_id: booking.master_id,
    service_id: booking.service_id,
    rating,
    comment: comment?.trim() ? comment.trim() : null,
  });

  return { success: true, message: 'Отзыв успешно сохранен' };
}
