import type {
  Booking,
  BookingReadable,
  BookingWithDetails,
  Client,
  ClientWithStats,
  Master,
  MasterAbsence,
  Review,
  Service,
} from '../../../shared/types.js';
import { db } from './db.js';

type MasterRow = {
  id: string;
  name: string;
  photo_url: string | null;
  description: string | null;
  specialization: string | null;
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
  client_phone: string | null;
  client_username: string | null;
  client_id: string | null;
  master_id: string;
  service_id: string;
  booking_date: string | Date;
  booking_time: string;
  status: Booking['status'];
  source: Booking['source'];
  cancellation_reason: string | null;
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

type AdminReviewRow = ReviewRow & {
  client_phone: string | null;
  client_username: string | null;
  master_name: string | null;
  service_name: string | null;
};

type ClientStatsRow = {
  id: string;
  telegram_id: number | null;
  name: string;
  username: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_spent: number;
  last_visit: string | Date | null;
};

type ClientRow = {
  id: string;
  telegram_id: number | null;
  name: string;
  username: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type BookingReadableRow = {
  id: string;
  booking_date: string | Date;
  booking_time: string;
  status: Booking['status'];
  source: Booking['source'];
  client_name: string;
  client_username: string | null;
  client_phone: string | null;
  client_notes: string | null;
  master_name: string;
  service_name: string;
  service_price: number;
  final_price: number;
  promo_code: string | null;
  admin_notes: string | null;
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

type MasterAbsenceRow = {
  id: string;
  master_id: string;
  start_date: string | Date;
  end_date: string | Date;
  reason: MasterAbsence['reason'];
  notes: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type ServicePayload = Pick<
  Service,
  'name' | 'description' | 'price' | 'duration_minutes' | 'category' | 'is_active'
>;

type MasterPayload = Pick<
  Master,
  'name' | 'description' | 'phone' | 'photo_url' | 'is_active'
>;

type ManualBookingPayload = {
  client_name: string;
  client_phone: string | null;
  master_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  admin_notes: string | null;
  source?: Booking['source'];
};

type MasterWorkSchedulePayload = Master['work_schedule'];
type MasterAbsencePayload = Pick<MasterAbsence, 'start_date' | 'end_date' | 'reason' | 'notes'>;

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
    client_phone: row.client_phone,
    client_username: row.client_username,
    client_id: row.client_id,
    master_id: row.master_id,
    service_id: row.service_id,
    booking_date: toDateString(row.booking_date),
    booking_time: row.booking_time,
    status: row.status,
    source: row.source,
    cancellation_reason: row.cancellation_reason,
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

function mapClientWithStats(row: ClientStatsRow): ClientWithStats {
  return {
    id: row.id,
    telegram_id: row.telegram_id,
    name: row.name,
    username: row.username,
    phone: row.phone,
    notes: row.notes,
    created_at: toIsoString(row.created_at) || '',
    updated_at: toIsoString(row.updated_at) || '',
    total_bookings: Number(row.total_bookings || 0),
    completed_bookings: Number(row.completed_bookings || 0),
    cancelled_bookings: Number(row.cancelled_bookings || 0),
    total_spent: Number(row.total_spent || 0),
    last_visit: toIsoString(row.last_visit),
  };
}

function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    telegram_id: row.telegram_id,
    name: row.name,
    username: row.username,
    phone: row.phone,
    notes: row.notes,
    created_at: toIsoString(row.created_at) || '',
    updated_at: toIsoString(row.updated_at) || '',
  };
}

function generateManualTelegramId() {
  return -(Date.now() * 1000 + Math.floor(Math.random() * 1000));
}

function mapBookingReadable(row: BookingReadableRow): BookingReadable {
  return {
    id: row.id,
    booking_date: toDateString(row.booking_date),
    booking_time: row.booking_time,
    status: row.status,
    source: row.source,
    client_name: row.client_name,
    client_username: row.client_username,
    client_phone: row.client_phone,
    client_notes: row.client_notes,
    master_name: row.master_name,
    service_name: row.service_name,
    service_price: row.service_price,
    final_price: row.final_price,
    promo_code: row.promo_code,
    admin_notes: row.admin_notes,
    created_at: toIsoString(row.created_at) || '',
  };
}

export async function getAdminReviewsPg() {
  const pool = requireDb();
  const result = await pool.query<AdminReviewRow>(
    `
      SELECT
        r.*,
        b.client_phone,
        b.client_username,
        m.name AS master_name,
        s.name AS service_name
      FROM reviews r
      LEFT JOIN bookings b ON b.id = r.booking_id
      LEFT JOIN masters m ON m.id = r.master_id
      LEFT JOIN services s ON s.id = r.service_id
      ORDER BY r.created_at DESC
    `,
  );

  return result.rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    created_at: toIsoString(row.created_at) || '',
    booking_id: row.booking_id,
    master_id: row.master_id,
    service_id: row.service_id,
    client_phone: row.client_phone,
    client_username: row.client_username,
    master_name: row.master_name || 'Мастер не найден',
    service_name: row.service_name || 'Услуга не найдена',
  }));
}

export async function getAdminClientsPg() {
  const pool = requireDb();
  const result = await pool.query<ClientStatsRow>(
    `
      SELECT
        c.*,
        COUNT(b.id)::int AS total_bookings,
        COUNT(*) FILTER (WHERE b.status = 'completed')::int AS completed_bookings,
        COUNT(*) FILTER (WHERE b.status = 'cancelled')::int AS cancelled_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN COALESCE(b.final_price, 0) ELSE 0 END), 0)::int AS total_spent,
        MAX(b.booking_date) AS last_visit
      FROM clients c
      LEFT JOIN bookings b ON b.client_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `,
  );

  return result.rows.map(mapClientWithStats);
}

export async function getAdminBookingsPg(
  fromDate: string,
  toDate: string,
  statuses: Booking['status'][] = ['active', 'pending'],
) {
  const pool = requireDb();
  const result = await pool.query<BookingReadableRow>(
    `
      SELECT
        b.id,
        b.booking_date,
        b.booking_time,
        b.status,
        b.source,
        b.client_name,
        b.client_username,
        b.client_phone,
        c.notes AS client_notes,
        m.name AS master_name,
        s.name AS service_name,
        s.price AS service_price,
        COALESCE(b.final_price, 0) AS final_price,
        b.promo_code,
        b.admin_notes,
        b.created_at
      FROM bookings b
      INNER JOIN masters m ON m.id = b.master_id
      INNER JOIN services s ON s.id = b.service_id
      LEFT JOIN clients c ON c.id = b.client_id
      WHERE b.booking_date >= $1
        AND b.booking_date <= $2
        AND b.status = ANY($3::text[])
      ORDER BY b.booking_date ASC, b.booking_time ASC
    `,
    [fromDate, toDate, statuses],
  );

  return result.rows.map(mapBookingReadable);
}

function mapMasterAbsence(row: MasterAbsenceRow): MasterAbsence {
  return {
    id: row.id,
    master_id: row.master_id,
    start_date: toDateString(row.start_date),
    end_date: toDateString(row.end_date),
    reason: row.reason,
    notes: row.notes,
    created_at: toIsoString(row.created_at) || '',
    updated_at: toIsoString(row.updated_at) || '',
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

export async function getAdminMastersPg() {
  const pool = requireDb();
  const result = await pool.query<MasterRow>(
    `
      SELECT *
      FROM masters
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

export async function createMasterPg(master: MasterPayload) {
  const pool = requireDb();
  const result = await pool.query<MasterRow>(
    `
      INSERT INTO masters (
        name,
        description,
        phone,
        photo_url,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [master.name, master.description, master.phone, master.photo_url, master.is_active],
  );

  return mapMaster(result.rows[0]);
}

export async function updateMasterPg(masterId: string, master: MasterPayload) {
  const pool = requireDb();
  const result = await pool.query<MasterRow>(
    `
      UPDATE masters
      SET
        name = $2,
        description = $3,
        phone = $4,
        photo_url = $5,
        is_active = $6
      WHERE id = $1
      RETURNING *
    `,
    [masterId, master.name, master.description, master.phone, master.photo_url, master.is_active],
  );

  if (result.rows.length === 0) {
    throw new Error('РњР°СЃС‚РµСЂ РЅРµ РЅР°Р№РґРµРЅ');
  }

  return mapMaster(result.rows[0]);
}

export async function toggleMasterActivePg(masterId: string, isActive: boolean) {
  const pool = requireDb();
  const result = await pool.query<MasterRow>(
    `
      UPDATE masters
      SET is_active = $2
      WHERE id = $1
      RETURNING *
    `,
    [masterId, isActive],
  );

  if (result.rows.length === 0) {
    throw new Error('РњР°СЃС‚РµСЂ РЅРµ РЅР°Р№РґРµРЅ');
  }

  return mapMaster(result.rows[0]);
}

export async function getMasterWorkSchedulePg(masterId: string) {
  const pool = requireDb();
  const result = await pool.query<{ work_schedule: MasterWorkSchedulePayload | null }>(
    `
      SELECT work_schedule
      FROM masters
      WHERE id = $1
      LIMIT 1
    `,
    [masterId],
  );

  if (result.rows.length === 0) {
    throw new Error('Мастер не найден');
  }

  return result.rows[0].work_schedule || {};
}

export async function updateMasterWorkSchedulePg(
  masterId: string,
  workSchedule: MasterWorkSchedulePayload,
) {
  const pool = requireDb();
  const result = await pool.query<MasterRow>(
    `
      UPDATE masters
      SET work_schedule = $2
      WHERE id = $1
      RETURNING *
    `,
    [masterId, JSON.stringify(workSchedule)],
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

export async function getAdminServicesPg() {
  const pool = requireDb();
  const result = await pool.query<ServiceRow>(
    `
      SELECT *
      FROM services
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

export async function addServiceToMasterPg(masterId: string, serviceId: string) {
  const pool = requireDb();

  await pool.query(
    `
      INSERT INTO master_services (master_id, service_id)
      VALUES ($1, $2)
      ON CONFLICT (master_id, service_id) DO NOTHING
    `,
    [masterId, serviceId],
  );
}

export async function removeServiceFromMasterPg(masterId: string, serviceId: string) {
  const pool = requireDb();

  await pool.query(
    `
      DELETE FROM master_services
      WHERE master_id = $1 AND service_id = $2
    `,
    [masterId, serviceId],
  );
}

export async function createServicePg(service: ServicePayload) {
  const pool = requireDb();
  const result = await pool.query<ServiceRow>(
    `
      INSERT INTO services (
        name,
        description,
        price,
        duration_minutes,
        category,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      service.name,
      service.description,
      service.price,
      service.duration_minutes,
      service.category,
      service.is_active,
    ],
  );

  return mapService(result.rows[0]);
}

export async function updateServicePg(serviceId: string, service: ServicePayload) {
  const pool = requireDb();
  const result = await pool.query<ServiceRow>(
    `
      UPDATE services
      SET
        name = $2,
        description = $3,
        price = $4,
        duration_minutes = $5,
        category = $6,
        is_active = $7
      WHERE id = $1
      RETURNING *
    `,
    [
      serviceId,
      service.name,
      service.description,
      service.price,
      service.duration_minutes,
      service.category,
      service.is_active,
    ],
  );

  if (result.rows.length === 0) {
    throw new Error('РЈСЃР»СѓРіР° РЅРµ РЅР°Р№РґРµРЅР°');
  }

  return mapService(result.rows[0]);
}

export async function toggleServiceActivePg(serviceId: string, isActive: boolean) {
  const pool = requireDb();
  const result = await pool.query<ServiceRow>(
    `
      UPDATE services
      SET is_active = $2
      WHERE id = $1
      RETURNING *
    `,
    [serviceId, isActive],
  );

  if (result.rows.length === 0) {
    throw new Error('РЈСЃР»СѓРіР° РЅРµ РЅР°Р№РґРµРЅР°');
  }

  return mapService(result.rows[0]);
}

export async function getMastersByServicePg(serviceId: string) {
  const pool = requireDb();
  const result = await pool.query<MasterRow>(
    `
      SELECT m.*
      FROM master_services ms
      INNER JOIN masters m ON m.id = ms.master_id
      WHERE ms.service_id = $1
      ORDER BY m.name ASC
    `,
    [serviceId],
  );

  return result.rows.map(mapMaster);
}

export async function getMasterAbsencesPg(masterId: string) {
  const pool = requireDb();
  const result = await pool.query<MasterAbsenceRow>(
    `
      SELECT *
      FROM master_absences
      WHERE master_id = $1
      ORDER BY start_date DESC
    `,
    [masterId],
  );

  return result.rows.map(mapMasterAbsence);
}

export async function createMasterAbsencePg(masterId: string, absence: MasterAbsencePayload) {
  const pool = requireDb();
  const result = await pool.query<MasterAbsenceRow>(
    `
      INSERT INTO master_absences (
        master_id,
        start_date,
        end_date,
        reason,
        notes
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [masterId, absence.start_date, absence.end_date, absence.reason, absence.notes],
  );

  return mapMasterAbsence(result.rows[0]);
}

export async function deleteMasterAbsencePg(absenceId: string) {
  const pool = requireDb();
  await pool.query(
    `
      DELETE FROM master_absences
      WHERE id = $1
    `,
    [absenceId],
  );
}

export async function getBookedTimesForDatePg(masterId: string, date: string) {
  const pool = requireDb();
  const result = await pool.query<{ booking_time: string }>(
    `
      SELECT booking_time
      FROM bookings
      WHERE master_id = $1
        AND booking_date = $2
        AND status = ANY($3::text[])
      ORDER BY booking_time ASC
    `,
    [masterId, date, ['pending', 'active', 'completed']],
  );

  return result.rows.map((row) => row.booking_time.substring(0, 5));
}

export async function createBookingPg(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) {
  const pool = requireDb();
  const result = await pool.query<BookingRow>(
    `
      INSERT INTO bookings (
        client_telegram_id,
        client_name,
        client_phone,
        client_username,
        client_id,
        master_id,
        service_id,
        booking_date,
        booking_time,
        status,
        source,
        cancellation_reason,
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
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
      RETURNING *
    `,
    [
      booking.client_telegram_id,
      booking.client_name,
      booking.client_phone,
      booking.client_username,
      booking.client_id,
      booking.master_id,
      booking.service_id,
      booking.booking_date,
      booking.booking_time,
      booking.status,
      booking.source,
      booking.cancellation_reason,
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

async function upsertManualClientPg(
  clientName: string,
  clientPhone: string | null,
  notes: string | null,
) {
  const pool = requireDb();
  const normalizedPhone = clientPhone?.trim() || null;

  if (!normalizedPhone) {
    return {
      client: null,
      clientTelegramId: generateManualTelegramId(),
    };
  }

  const existingClientResult = await pool.query<ClientRow>(
    `
      SELECT *
      FROM clients
      WHERE phone = $1
      ORDER BY created_at ASC
      LIMIT 1
    `,
    [normalizedPhone],
  );

  if (existingClientResult.rows.length > 0) {
    const existingClient = mapClient(existingClientResult.rows[0]);
    const clientTelegramId =
      existingClient.telegram_id && existingClient.telegram_id !== 0
        ? existingClient.telegram_id
        : generateManualTelegramId();

    const updatedClientResult = await pool.query<ClientRow>(
      `
        UPDATE clients
        SET
          telegram_id = COALESCE(telegram_id, $2),
          name = $3,
          phone = $4,
          notes = COALESCE($5, notes),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [existingClient.id, clientTelegramId, clientName, normalizedPhone, notes],
    );

    return {
      client: mapClient(updatedClientResult.rows[0]),
      clientTelegramId,
    };
  }

  const clientTelegramId = generateManualTelegramId();
  const createdClientResult = await pool.query<ClientRow>(
    `
      INSERT INTO clients (
        telegram_id,
        name,
        username,
        phone,
        notes
      )
      VALUES ($1, $2, NULL, $3, $4)
      RETURNING *
    `,
    [clientTelegramId, clientName, normalizedPhone, notes],
  );

  return {
    client: mapClient(createdClientResult.rows[0]),
    clientTelegramId,
  };
}

export async function createManualBookingPg(data: ManualBookingPayload) {
  const service = await getServiceByIdPg(data.service_id);
  const { client, clientTelegramId } = await upsertManualClientPg(
    data.client_name.trim(),
    data.client_phone,
    data.admin_notes,
  );

  return createBookingPg({
    client_telegram_id: clientTelegramId,
    client_name: data.client_name.trim(),
    client_phone: data.client_phone?.trim() || null,
    client_username: null,
    client_id: client?.id || null,
    master_id: data.master_id,
    service_id: data.service_id,
    booking_date: data.booking_date,
    booking_time: data.booking_time,
    status: 'active',
    source: data.source || 'manual',
    cancellation_reason: null,
    original_price: service.price,
    discount_amount: 0,
    final_price: service.price,
    promo_code: null,
    admin_notes: data.admin_notes,
    reminder_24h_sent_at: null,
    reminder_1h_sent_at: null,
    review_request_sent_at: null,
  });
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
