-- =============================================================================
-- Idempotency keys — evita turnos duplicados por reintentos de red en
-- POST /bookings (doble click, timeout que reintenta, etc).
--
-- `appointment_id` arranca NULL: la fila se reserva ANTES de intentar crear
-- el turno (ver app/services/bookings.create_booking_idempotent), así dos
-- requests con la misma key en simultáneo no pueden generar dos turnos.
-- =============================================================================

create table public.idempotency_keys (
  key            text primary key check (length(key) between 1 and 200),
  salon_id       uuid not null references public.salons (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete cascade,
  created_at     timestamptz not null default now()
);

create index idempotency_keys_appointment_idx on public.idempotency_keys (appointment_id);

-- Sin borrado automático (a propósito: nada en este proyecto corre jobs
-- programados todavía). El índice queda listo para cuando exista un cron de
-- limpieza que barra keys viejas ya resueltas.
create index idempotency_keys_created_at_idx on public.idempotency_keys (created_at);
