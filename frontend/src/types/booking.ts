export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Booking {
  id: string;
  serviceName: string;
  staffName: string;
  clientName: string;
  startTime: string;
  endTime: string;
  price: number;
  currency: string;
  status: AppointmentStatus;
  notes?: string | null;
}
