// Общие типы для всего проекта

export interface Master {
  id: string;
  name: string;
  photo_url: string | null;
  description: string | null;
  specialization: string | null;
  phone: string | null;
  is_active: boolean;
  work_schedule: {
    monday?: string[];
    tuesday?: string[];
    wednesday?: string[];
    thursday?: string[];
    friday?: string[];
    saturday?: string[];
    sunday?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MasterService {
  master_id: string;
  service_id: string;
}

export interface MasterSchedule {
  id: string;
  master_id: string;
  day_of_week: number; // 0 = Monday, 6 = Sunday
  start_time: string;
  end_time: string;
  is_working: boolean;
}

export type BookingStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'no_show';
export type BookingSource = 'online' | 'manual' | 'phone' | 'walk_in';

export interface Booking {
  id: string;
  client_telegram_id: number;
  client_name: string;
  client_phone: string | null;
  client_username: string | null;
  client_id: string | null;
  master_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  source: BookingSource;
  cancellation_reason: string | null;
  original_price: number;
  discount_amount: number;
  final_price: number;
  promo_code: string | null;
  admin_notes: string | null;
  reminder_24h_sent_at: string | null;
  reminder_1h_sent_at: string | null;
  review_request_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  telegram_id: number | null;
  name: string;
  username: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingReadable {
  id: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  source: BookingSource;
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
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  client_telegram_id: number;
  master_id: string;
  service_id: string;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
}

export interface Admin {
  telegram_id: number;
  name: string;
  added_at: string;
}

// Расширенные типы с JOIN данными
export interface BookingWithDetails extends Booking {
  master: Master;
  service: Service;
  client?: Client;
}

export interface ClientWithStats extends Client {
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_spent: number;
  last_visit: string | null;
}

export type AbsenceReason = 'vacation' | 'sick_leave' | 'other';

export interface MasterAbsence {
  id: string;
  master_id: string;
  start_date: string;
  end_date: string;
  reason: AbsenceReason;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailableSlots {
  date: string;
  slots: TimeSlot[];
}
