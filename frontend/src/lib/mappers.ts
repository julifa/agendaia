import type { ApiBooking, ApiPublicStaff, ApiService } from "../types/api";
import type { Booking } from "../types/booking";

export function toDisplayBooking(
  api: ApiBooking,
  service: ApiService | undefined,
  staff: ApiPublicStaff | undefined,
  clientDisplayName: string,
): Booking {
  return {
    id: api.id,
    serviceName: service?.name ?? "Servicio",
    staffName: staff?.full_name ?? "Profesional asignado",
    clientName: clientDisplayName,
    startTime: api.start_time,
    endTime: api.end_time,
    price: Number(api.price),
    currency: api.currency,
    status: api.status,
    notes: api.notes,
  };
}
