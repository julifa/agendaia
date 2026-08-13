import type { AppointmentStatus, Booking } from "../types/booking";

interface StatusStyle {
  label: string;
  className: string;
}

/**
 * Mapeo de estado -> presentación. `confirmed` recibe el color champagne
 * (el estado "bueno" del negocio); `pending` se queda en baby pink, más
 * neutro, porque todavía requiere una acción del salón.
 */
const STATUS_STYLES: Record<AppointmentStatus, StatusStyle> = {
  pending: {
    label: "Pendiente",
    className: "bg-baby-pink/40 text-charcoal",
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-champagne/15 text-champagne",
  },
  completed: {
    label: "Completado",
    className: "bg-charcoal/10 text-charcoal/70",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-charcoal/5 text-charcoal/40 line-through",
  },
  no_show: {
    label: "No asistió",
    className: "bg-charcoal/5 text-charcoal/40",
  },
};

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const currencyFormatter = (currency: string) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency });

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface BookingCardProps {
  booking: Booking;
  /** Se omite en tarjetas de solo lectura (ej. historial). */
  onCancel?: (id: string) => void;
  onConfirm?: (id: string) => void;
  className?: string;
}

export function BookingCard({
  booking,
  onCancel,
  onConfirm,
  className = "",
}: BookingCardProps) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const status = STATUS_STYLES[booking.status];
  const isActive = booking.status === "pending" || booking.status === "confirmed";

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-baby-pink/30
        bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-lg hover:shadow-baby-pink/20 ${className}`}
    >
      {/* Filo superior en champagne: el único acento "de lujo" de la tarjeta. */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-champagne/0 via-champagne to-champagne/0" />

      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold leading-tight text-charcoal">
            {booking.serviceName}
          </h3>
          <p className="mt-1 text-sm text-charcoal/60">
            con {booking.staffName}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium tracking-wide ${status.className}`}
        >
          {status.label}
        </span>
      </header>

      <div className="mt-5 flex items-center gap-3 border-y border-charcoal/10 py-4 text-sm text-charcoal/80">
        <div className="flex-1">
          <p className="font-display text-base text-charcoal">
            {capitalize(dateFormatter.format(start))}
          </p>
          <p className="text-charcoal/60">
            {timeFormatter.format(start)} – {timeFormatter.format(end)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-charcoal/50">
            Cliente
          </p>
          <p className="text-charcoal">{booking.clientName}</p>
        </div>
      </div>

      <footer className="mt-5 flex items-center justify-between gap-3">
        <p className="font-display text-lg font-semibold text-champagne">
          {currencyFormatter(booking.currency).format(booking.price)}
        </p>

        {isActive && (onCancel || onConfirm) && (
          <div className="flex gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={() => onCancel(booking.id)}
                className="rounded-full border border-charcoal/20 px-4 py-1.5 text-sm
                  text-charcoal/70 transition-colors duration-200 hover:border-charcoal/40 hover:text-charcoal"
              >
                Cancelar
              </button>
            )}
            {onConfirm && booking.status === "pending" && (
              <button
                type="button"
                onClick={() => onConfirm(booking.id)}
                className="rounded-full bg-baby-pink px-4 py-1.5 text-sm font-medium
                  text-charcoal transition-colors duration-200 hover:bg-champagne hover:text-white"
              >
                Confirmar
              </button>
            )}
          </div>
        )}
      </footer>
    </article>
  );
}

export default BookingCard;
