import type { Booking, BookingWithDetails, Master, Review, Service } from '../../../shared/types.js';
import { db } from './db.js';

type MasterRow = {
  id: string;
  name: string;
  photo_url: string | null;
  description: string | null;
  specialization: string | null;
  google_calendar_id: string | null;
  phone: string | null;
  is_active: boolean;
  work_schedule: Master['work_schedule'] | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string | null;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

type BookingRow = {
  id: string;
  client_telegram_id: number;
  client_name: string;
  client_username: string | null;
  client_id: string | null;
  master_id: string;
  service_id: string;
  booking_date: string | Date;
  booking_time: string;
  status: Booking['status'];
  source: Booking['source'];
  cancellation_reason: string | null;
  google_event_id: string | null;
  original_price: number | null;
  discount_amount: number | null;
  final_price: number | null;
  promo_code: string | null;
  admin_notes: string | null;
  reminder_24h_sent_at: string | Date | null;
  reminder_1h_sent_at: string | Date | null;
  review_request_sent_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type BookingDetailsRow = BookingRow & {
  master: MasterRow;
  service: ServiceRow;
};

type ReviewRow = {
  id: string;
  booking_id: string;
  client_telegram_id: number;
  master_id: string;
  service_id: string;
  rating: number;
  comment: string | null;
  created_at: string | Date;
};

type PromoCodeRow = {
  id: string;
  code: string;
  client_telegram_id: number | null;
  discount_percent: number;
  valid_from: string | Date;
  valid_until: string | Date;
  is_used: boolean;
  used_at: string | Date | null;
  booking_id: string | null;
  is_reusable: boolean;
  usage_limit: number | null;
  usage_count: number;
  created_at: string | Date;
  updated_at: string | Date;
};

function requireDb() {
  if (!db) {
    throw new Error('PostgreSQL не настроен');
  }

  return db;
}

function toIsoString(value: string | Date | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function toDateString(value: string | Date) {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  return value;
}

function mapMaster(row: MasterRow): Master {
  return {
    id: row.id,
    name: row.name,
    photo_url: row.photo_url,
    description: row.description,
    specialization: row.specialization,
    google_calendar_id: row.google_calendar_id,
    phone: row.phone,
    is_active: row.is_active,
    work_schedule: row.work_schedule || {},
    created_at: toIsoString(row.created_at) || '',
    updated_at: toIsoString(row.updated_at) || '',
  };
}

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    duration_minutes: row.duration_minutes,
    category: row.category,
    is_active: row.is_active,
    created_at: toIsoString(row.created_at) || '',
    updated_at: toIsoString(row.updated_at) || '',
  };
}

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    client_telegram_id: row.client_telegram_id,
    client_name: row.client_name,
    client_username: row.client_username,
    client_id: row.client_id,
    master_id: row.master_id,
    service_id: row.service_id,
    booking_date: toDateString(row.booking_date),
    booking_time: row.booking_time,
    status: row.status,
    source: row.source,
    cancellation_reason: row.cancellation_reason,
    google_event_id: row.google_event_id,
    original_price: row.original_price ?? 0,
    discount_amount: row.discount_amount ?? 0,
    final_price: row.final_price ?? 0,
    promo_code: row.promo_code,
    admin_notes: row.admin_notes,
    reminder_24h_sent_at: toIsoString(row.reminder_24h_sent_at),
    reminder_1h_sent_at: toIsoString(row.reminder_1h_sent_at),
    review_request_sent_at: toIsoString(row.review_request_sent_at),
    created_at: toIsoString(row.created_at) || '',
    updated_at: toIsoString(row.updated_at) || '',
  };
}

function mapBookingWithDetails(row: BookingDetailsRow): BookingWithDetails {
  return {
    ...mapBooking(row),
    master: mapMaster(row.master),
    service: mapService(row.service),
  };
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    booking_id: row.booking_id,
    client_telegram_id: row.client_telegram_id,
    master_id: row.master_id,
    service_id: row.service_id,
    rating: row.rating,
    comment: row.comment,
    created_at: toIsoString(row.created_at) || '',
  };
}

async function queryBookingsWithDetails(whereClause: string, values: unknown[] = []) {
  const pool = requireDb();
  const result = await pool.query<BookingDetailsRow>(
    `
      SELECT
        b.*,
        row_to_json(m) AS master,
        row_to_json(s) AS service
      FROM bookings b
      INNER JOIN masters m ON m.id = b.master_id
      INNER JOIN services s ON s.id = b.service_id
      ${whereClause}
    `,
    values,
  );

  return result.rows.map(mapBookingWithDetails);
}

export async function getMastersPg() {
  const pool = requireDb();
  const result = await pool.query<MasterRow>(
    `
      SELECT *
      FROM masters
      WHERE is_active = TRUE
      ORDER BY name
    `,
  );

  return result.rows.map(mapMaster);
}

export async function getMasterByIdPg(id: string) {
  const pool = requireDb();
  const result = await pool.query<MasterRow>(
    `
      SELECT *
      FROM masters
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    throw new Error('Мастер не найден');
  }

  return mapMaster(result.rows[0]);
}

export async function getServicesPg() {
  const pool = requireDb();
  const result = await pool.query<ServiceRow>(
    `
      SELECT *
      FROM services
      WHERE is_active = TRUE
      ORDER BY category ASC NULLS LAST, name ASC
    `,
  );

  return result.rows.map(mapService);
}

export async function getServiceByIdPg(id: string) {
  const pool = requireDb();
  const result = await pool.query<ServiceRow>(
    `
      SELECT *
      FROM services
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    throw new Error('Услуга не найдена');
  }

  return mapService(result.rows[0]);
}

export async function getServicesByMasterPg(masterId: string) {
  const pool = requireDb();
  const result = await pool.query<ServiceRow>(
    `
      SELECT s.*
      FROM master_services ms
      INNER JOIN services s ON s.id = ms.service_id
      WHERE ms.master_id = $1
      ORDER BY s.category ASC NULLS LAST, s.name ASC
    `,
    [masterId],
  );

  return result.rows.map(mapService);
}

export async function createBookingPg(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) {
  const pool = requireDb();
  const result = await pool.query<BookingRow>(
    `
      INSERT INTO bookings (
        client_telegram_id,
        client_name,
        client_username,
        client_id,
        master_id,
        service_id,
        booking_date,
        booking_time,
        status,
        source,
        cancellation_reason,
        google_event_id,
        original_price,
        discount_amount,
        final_price,
        promo_code,
        admin_notes,
        reminder_24h_sent_at,
        reminder_1h_sent_at,
        review_request_sent_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
      RETURNING *
    `,
    [
      booking.client_telegram_id,
      booking.client_name,
      booking.client_username,
      booking.client_id,
      booking.master_id,
      booking.service_id,
      booking.booking_date,
      booking.booking_time,
      booking.status,
      booking.source,
      booking.cancellation_reason,
      booking.google_event_id,
      booking.original_price,
      booking.discount_amount,
      booking.final_price,
      booking.promo_code,
      booking.admin_notes,
      booking.reminder_24h_sent_at,
      booking.reminder_1h_sent_at,
      booking.review_request_sent_at,
    ],
  );

  return mapBooking(result.rows[0]);
}

export async function getBookingByIdPg(id: string) {
  const bookings = await queryBookingsWithDetails('WHERE b.id = $1 LIMIT 1', [id]);

  if (bookings.length === 0) {
    throw new Error('Запись не найдена');
  }

  return bookings[0];
}

export async function getClientBookingsPg(telegramId: number) {
  return queryBookingsWithDetails(
    `
      WHERE b.client_telegram_id = $1
      ORDER BY b.booking_date DESC, b.booking_time DESC
    `,
    [telegramId],
  );
}

export async function getUpcomingBookingsPg(hoursAhead: number) {
  const now = new Date();
  const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  const fromDate = now.toISOString().split('T')[0];
  const toDate = targetTime.toISOString().split('T')[0];

  return queryBookingsWithDetails(
    `
      WHERE b.status = 'active'
        AND b.booking_date >= $1
        AND b.booking_date <= $2
      ORDER BY b.booking_date ASC, b.booking_time ASC
    `,
    [fromDate, toDate],
  );
}

export async function getBookingsForDateRangePg(
  fromDate: string,
  toDate: string,
  statuses: string[] = ['active'],
) {
  return queryBookingsWithDetails(
    `
      WHERE b.status = ANY($3::text[])
        AND b.booking_date >= $1
        AND b.booking_date <= $2
      ORDER BY b.booking_date ASC, b.booking_time ASC
    `,
    [fromDate, toDate, statuses],
  );
}

export async function markBookingNotificationSentPg(
  bookingId: string,
  type: 'reminder_24h' | 'reminder_1h' | 'review_request',
) {
  const pool = requireDb();
  const column =
    type === 'reminder_24h'
      ? 'reminder_24h_sent_at'
      : type === 'reminder_1h'
        ? 'reminder_1h_sent_at'
        : 'review_request_sent_at';

  await pool.query(
    `
      UPDATE bookings
      SET ${column} = NOW()
      WHERE id = $1
    `,
    [bookingId],
  );
}

export async function cancelBookingPg(id: string, reason?: string) {
  const pool = requireDb();
  const result = await pool.query<BookingRow>(
    `
      UPDATE bookings
      SET
        status = 'cancelled',
        cancellation_reason = $2
      WHERE id = $1
      RETURNING *
    `,
    [id, reason || null],
  );

  if (result.rows.length === 0) {
    throw new Error('Запись не найдена');
  }

  return mapBooking(result.rows[0]);
}

export async function completeBookingPg(id: string) {
  const pool = requireDb();
  const result = await pool.query<BookingRow>(
    `
      UPDATE bookings
      SET status = 'completed'
      WHERE id = $1
      RETURNING *
    `,
    [id],
  );

  if (result.rows.length === 0) {
    throw new Error('Запись не найдена');
  }

  return mapBooking(result.rows[0]);
}

export async function createReviewPg(review: Omit<Review, 'id' | 'created_at'>) {
  const pool = requireDb();
  const result = await pool.query<ReviewRow>(
    `
      INSERT INTO reviews (
        booking_id,
        client_telegram_id,
        master_id,
        service_id,
        rating,
        comment
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      review.booking_id,
      review.client_telegram_id,
      review.master_id,
      review.service_id,
      review.rating,
      review.comment,
    ],
  );

  return mapReview(result.rows[0]);
}

export async function hasReviewPg(bookingId: string) {
  const pool = requireDb();
  const result = await pool.query<{ id: string }>(
    `
      SELECT id
      FROM reviews
      WHERE booking_id = $1
      LIMIT 1
    `,
    [bookingId],
  );

  return result.rows.length > 0;
}

export async function isAdminPg(telegramId: number) {
  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (adminId && String(telegramId) === String(adminId)) {
    return true;
  }

  const pool = requireDb();
  const result = await pool.query<{ telegram_id: number }>(
    `
      SELECT telegram_id
      FROM admins
      WHERE telegram_id = $1
      LIMIT 1
    `,
    [telegramId],
  );

  return result.rows.length > 0;
}

export async function createPromoCodePg(
  code: string,
  clientTelegramId: number,
  discountPercent: number,
  validUntilIso: string,
) {
  const pool = requireDb();
  const result = await pool.query<PromoCodeRow>(
    `
      INSERT INTO promo_codes (
        code,
        client_telegram_id,
        discount_percent,
        valid_until
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [code, clientTelegramId, discountPercent, validUntilIso],
  );

  return result.rows[0];
}

export async function validatePromoCodePg(code: string, clientTelegramId: number) {
  const pool = requireDb();
  const upperCode = code.toUpperCase();

  const reusableResult = await pool.query<PromoCodeRow>(
    `
      SELECT *
      FROM promo_codes
      WHERE code = $1
        AND is_reusable = TRUE
        AND valid_until >= NOW()
      LIMIT 1
    `,
    [upperCode],
  );

  if (reusableResult.rows.length > 0) {
    const reusablePromo = reusableResult.rows[0];
    if (reusablePromo.usage_limit && reusablePromo.usage_count >= reusablePromo.usage_limit) {
      return null;
    }

    return reusablePromo;
  }

  const result = await pool.query<PromoCodeRow>(
    `
      SELECT *
      FROM promo_codes
      WHERE code = $1
        AND client_telegram_id = $2
        AND is_used = FALSE
        AND valid_until >= NOW()
      LIMIT 1
    `,
    [upperCode, clientTelegramId],
  );

  return result.rows[0] || null;
}

export async function usePromoCodePg(code: string, bookingId: string) {
  const pool = requireDb();
  const upperCode = code.toUpperCase();

  const promoResult = await pool.query<PromoCodeRow>(
    `
      SELECT *
      FROM promo_codes
      WHERE code = $1
      LIMIT 1
    `,
    [upperCode],
  );

  const promo = promoResult.rows[0];
  if (!promo) {
    throw new Error('Промокод не найден');
  }

  if (promo.is_reusable) {
    const result = await pool.query<PromoCodeRow>(
      `
        UPDATE promo_codes
        SET usage_count = usage_count + 1
        WHERE code = $1
        RETURNING *
      `,
      [upperCode],
    );

    return result.rows[0];
  }

  const result = await pool.query<PromoCodeRow>(
    `
      UPDATE promo_codes
      SET
        is_used = TRUE,
        used_at = NOW(),
        booking_id = $2
      WHERE code = $1
      RETURNING *
    `,
    [upperCode, bookingId],
  );

  return result.rows[0];
}

export async function getInactiveClientsPg(daysInactive = 60) {
  const pool = requireDb();
  const result = await pool.query<{ client_telegram_id: number }>(
    `
      SELECT b.client_telegram_id
      FROM bookings b
      WHERE b.client_telegram_id IS NOT NULL
        AND b.status = 'active'
      GROUP BY b.client_telegram_id
      HAVING MAX(b.booking_date) < CURRENT_DATE - ($1::int * INTERVAL '1 day')
        AND NOT EXISTS (
          SELECT 1
          FROM promo_codes p
          WHERE p.client_telegram_id = b.client_telegram_id
            AND p.created_at >= NOW() - ($1::int * INTERVAL '1 day')
        )
    `,
    [daysInactive],
  );

  return result.rows.map((row) => row.client_telegram_id);
}
