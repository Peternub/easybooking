import type { Booking, BookingWithDetails, Master, Service } from '../../../shared/types.js';
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
      WHERE b.id = $1
      LIMIT 1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    throw new Error('Запись не найдена');
  }

  return mapBookingWithDetails(result.rows[0]);
}
