import type { AppointmentStatus } from "./booking";

/**
 * Tipos que reflejan tal cual la forma de la API (snake_case, ids sin
 * resolver a nombres). `types/booking.ts` define el modelo de *presentación*
 * que consume `BookingCard`; `lib/mappers.ts` traduce de uno a otro.
 */

export interface ApiService {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
  currency: string;
  is_active: boolean;
}

export interface ApiSlot {
  start: string;
  end: string;
  staff_ids: string[];
}

export interface ApiAvailability {
  salon_id: string;
  service_id: string;
  date: string;
  slots: ApiSlot[];
}

export interface ApiBooking {
  id: string;
  salon_id: string;
  client_id: string | null;
  guest_name: string | null;
  staff_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price: number;
  currency: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}

export interface ApiPublicStaff {
  id: string;
  full_name: string;
}

export interface ApiProfile {
  id: string;
  salon_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: "owner" | "staff" | "client";
  is_active: boolean;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  context: Record<string, unknown>;
}
