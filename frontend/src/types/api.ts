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
  // Pydantic serializa Decimal como string para no perder precisión.
  price: string;
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

export type PaymentMethod = "cash" | "mercadopago";
export type PaymentStatus = "unpaid" | "pending" | "paid";

export interface ApiBooking {
  id: string;
  salon_id: string;
  client_id: string | null;
  // Resuelto server-side; null para invitados (ver guest_name).
  client_name: string | null;
  guest_name: string | null;
  staff_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  // Pydantic serializa Decimal como string para no perder precisión.
  price: string;
  currency: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  deposit_amount: string | null;
  // Solo viene en la respuesta de POST /bookings, no en GET.
  mp_init_point: string | null;
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

// --- Administración -----------------------------------------------------

export interface ApiStaff {
  id: string;
  salon_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: "owner" | "staff" | "client";
  is_active: boolean;
}

export interface ServiceInput {
  name: string;
  description?: string | null;
  duration_minutes: number;
  buffer_minutes?: number;
  price: string;
  currency?: string;
}

export interface ServiceUpdateInput {
  name?: string;
  description?: string | null;
  duration_minutes?: number;
  buffer_minutes?: number;
  price?: string;
  currency?: string;
  is_active?: boolean;
}

export interface ApiScheduleBlock {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface ScheduleBlockInput {
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface StaffInviteInput {
  email: string;
  full_name: string;
  role: "owner" | "staff";
}

export interface ApiTimeOff {
  id: string;
  staff_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}
