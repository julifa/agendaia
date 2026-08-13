import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, ApiError } from "../lib/api";
import { toDisplayBooking } from "../lib/mappers";
import { useAuth } from "../hooks/useAuth";
import { BookingCard } from "./BookingCard";
import type { ApiAvailability, ApiBooking, ApiPublicStaff, ApiService, ApiSlot } from "../types/api";

const SALON_ID = import.meta.env.VITE_SALON_ID;

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
});

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BookingFlow() {
  const { user } = useAuth();

  const [services, setServices] = useState<ApiService[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [staffForService, setStaffForService] = useState<ApiPublicStaff[]>([]);

  const [date, setDate] = useState(todayISODate());
  const [slots, setSlots] = useState<ApiSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ApiSlot | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ApiBooking | null>(null);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );

  useEffect(() => {
    apiGet<ApiService[]>(`/services?salon_id=${SALON_ID}`)
      .then(setServices)
      .catch((err) =>
        setServicesError(err instanceof Error ? err.message : "No se pudieron cargar los servicios"),
      );
  }, []);

  useEffect(() => {
    if (!selectedServiceId) {
      setStaffForService([]);
      return;
    }
    apiGet<ApiPublicStaff[]>(`/services/${selectedServiceId}/staff`)
      .then(setStaffForService)
      .catch(() => setStaffForService([]));
  }, [selectedServiceId]);

  useEffect(() => {
    if (!selectedServiceId) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(null);
    const params = new URLSearchParams({
      salon_id: SALON_ID,
      service_id: selectedServiceId,
      date,
    });
    apiGet<ApiAvailability>(`/availability?${params}`)
      .then((res) => setSlots(res.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedServiceId, date]);

  async function refreshSlots() {
    if (!selectedServiceId) return;
    setLoadingSlots(true);
    const params = new URLSearchParams({
      salon_id: SALON_ID,
      service_id: selectedServiceId,
      date,
    });
    try {
      const res = await apiGet<ApiAvailability>(`/availability?${params}`);
      setSlots(res.slots);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSubmit() {
    if (!selectedService || !selectedSlot) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const booking = await apiPost<ApiBooking>("/bookings", {
        salon_id: SALON_ID,
        service_id: selectedService.id,
        start_time: selectedSlot.start,
        guest_name: user ? undefined : guestName,
        guest_phone: user ? undefined : guestPhone || undefined,
      });
      setConfirmed(booking);
    } catch (err) {
      if (err instanceof ApiError && err.code === "slot_unavailable") {
        setFormError("Justo se ocupó ese horario. Elegí otro de la lista.");
        await refreshSlots();
        setSelectedSlot(null);
      } else {
        setFormError(err instanceof Error ? err.message : "No se pudo crear la reserva");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setConfirmed(null);
    setSelectedSlot(null);
    setGuestName("");
    setGuestPhone("");
    void refreshSlots();
  }

  if (confirmed && selectedService) {
    const assignedStaff = staffForService.find((s) => s.id === confirmed.staff_id);
    return (
      <div className="mx-auto max-w-md">
        <p className="mb-4 text-center font-display text-lg text-champagne">
          ¡Turno confirmado!
        </p>
        <BookingCard
          booking={toDisplayBooking(
            confirmed,
            selectedService,
            assignedStaff,
            user?.user_metadata?.full_name ?? (guestName || "Vos"),
          )}
        />
        <button
          type="button"
          onClick={reset}
          className="mt-6 w-full rounded-full border border-charcoal/20 py-2 text-sm text-charcoal/70
            transition-colors hover:border-charcoal/40 hover:text-charcoal"
        >
          Reservar otro turno
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      {/* Paso 1: servicio */}
      <section>
        <h2 className="font-display text-lg text-charcoal">1. Elegí un servicio</h2>
        {servicesError && <p className="mt-2 text-sm text-red-600">{servicesError}</p>}
        <div className="mt-3 flex flex-col gap-2">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => setSelectedServiceId(service.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                service.id === selectedServiceId
                  ? "border-champagne bg-champagne/10"
                  : "border-charcoal/15 bg-white/60 hover:border-baby-pink"
              }`}
            >
              <p className="font-display text-charcoal">{service.name}</p>
              <p className="text-sm text-charcoal/60">
                {service.duration_minutes} min ·{" "}
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: service.currency,
                }).format(Number(service.price))}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Paso 2: fecha y horario */}
      {selectedService && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-charcoal">2. Elegí día y horario</h2>
          <input
            type="date"
            value={date}
            min={todayISODate()}
            onChange={(e) => setDate(e.target.value)}
            className="mt-3 rounded-xl border border-charcoal/15 bg-white px-4 py-2 text-sm text-charcoal outline-none focus:border-champagne"
          />

          <div className="mt-3 grid grid-cols-3 gap-2">
            {loadingSlots && (
              <p className="col-span-3 text-sm text-charcoal/50">Buscando horarios...</p>
            )}
            {!loadingSlots && slots.length === 0 && (
              <p className="col-span-3 text-sm text-charcoal/50">
                No hay turnos disponibles ese día.
              </p>
            )}
            {slots.map((slot) => (
              <button
                key={slot.start}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  slot.start === selectedSlot?.start
                    ? "border-champagne bg-champagne text-white"
                    : "border-charcoal/15 bg-white/60 text-charcoal hover:border-baby-pink"
                }`}
              >
                {timeFormatter.format(new Date(slot.start))}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Paso 3: datos del invitado (si no hay sesión) */}
      {selectedSlot && !user && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-charcoal">3. Tus datos</h2>
          <div className="mt-3 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Nombre"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="rounded-xl border border-charcoal/15 bg-white px-4 py-2 text-sm text-charcoal outline-none focus:border-champagne"
            />
            <input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="rounded-xl border border-charcoal/15 bg-white px-4 py-2 text-sm text-charcoal outline-none focus:border-champagne"
            />
          </div>
        </section>
      )}

      {selectedSlot && (
        <section className="mt-8">
          {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}
          <button
            type="button"
            disabled={submitting || (!user && !guestName.trim())}
            onClick={handleSubmit}
            className="w-full rounded-full bg-baby-pink py-3 text-sm font-medium text-charcoal
              transition-colors duration-200 hover:bg-champagne hover:text-white disabled:opacity-50"
          >
            {submitting ? "Reservando..." : "Confirmar reserva"}
          </button>
        </section>
      )}
    </div>
  );
}
