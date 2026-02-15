// Общие типы для всего проекта

export interface Master {
  id: string;
  name: string;
  photo_url: string;
  description: string;
  specialization: string;
  google_calendar_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  is_active: boolean;
  created_at: string;
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

export interface MasterScheduleException {
  id: string;
  master_id: string;
  date: string;
  reason: string;
  created_at: string;
}

export type BookingStatus = 'active' | 'completed' | 'cancelled_by_client' | 'cancelled_by_admin';

export interface Booking {
  id: string;
  client_telegram_id: number;
  client_name: string;
  client_username: string | null;
  master_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  cancellation_reason: string | null;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
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
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailableSlots {
  date: string;
  slots: TimeSlot[];
}
