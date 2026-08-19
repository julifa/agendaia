-- =============================================================================
-- Horario de staff por fecha específica + bloqueo de agenda completa
--
-- `staff_schedules` (semanal recurrente, ej. "todos los martes 13-17") queda
-- deprecada a partir de acá: el backend deja de leerla/escribirla. No se
-- dropea la tabla para no perder datos históricos ya cargados; una migración
-- futura puede limpiarla si hace falta.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- staff_schedule_dates — horario laboral anclado a una fecha puntual del
-- calendario (no se repite). Mismo patrón de bloques que staff_schedules,
-- pero con `date` en vez de `weekday`.
-- -----------------------------------------------------------------------------
create table public.staff_schedule_dates (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references public.salons (id) on delete cascade,
  staff_id    uuid not null,
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  created_at  timestamptz not null default now(),

  constraint staff_schedule_dates_order_check check (end_time > start_time),
  constraint staff_schedule_dates_staff_fk foreign key (staff_id, salon_id)
    references public.profiles (id, salon_id) on delete cascade,
  -- Dos bloques del mismo día no pueden solaparse (sí pueden ser disjuntos,
  -- p. ej. mañana y tarde con corte al mediodía).
  constraint staff_schedule_dates_no_overlap exclude using gist (
    staff_id  with =,
    date      with =,
    public.timerange(start_time, end_time, '[)') with &&
  )
);

comment on table public.staff_schedule_dates is
  'Horario laboral por fecha concreta del calendario. Reemplaza a staff_schedules (semanal recurrente) como fuente de disponibilidad.';

create index staff_schedule_dates_lookup_idx on public.staff_schedule_dates (staff_id, date);

alter table public.staff_schedule_dates enable row level security;

create policy staff_schedule_dates_read on public.staff_schedule_dates
  for select using (true);

create policy staff_schedule_dates_write on public.staff_schedule_dates
  for all
  using (salon_id = public.current_salon_id()
         and (staff_id = auth.uid() or public.current_role_is(array['owner']::public.user_role[])))
  with check (salon_id = public.current_salon_id()
         and (staff_id = auth.uid() or public.current_role_is(array['owner']::public.user_role[])));

-- -----------------------------------------------------------------------------
-- salon_closures — cierre del salón entero (feriado, vacaciones), corta la
-- agenda de todos los profesionales sin tener que tocar el horario de cada
-- uno individualmente.
-- -----------------------------------------------------------------------------
create table public.salon_closures (
  id         uuid primary key default gen_random_uuid(),
  salon_id   uuid not null references public.salons (id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  reason     text,
  created_at timestamptz not null default now(),

  period tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,

  constraint salon_closures_order_check check (ends_at > starts_at),
  constraint salon_closures_no_overlap exclude using gist (
    salon_id with =,
    period   with &&
  )
);

comment on table public.salon_closures is
  'Bloqueo de agenda a nivel salón (feriado, vacaciones): ningún profesional del salón queda disponible durante el rango.';

create index salon_closures_period_idx on public.salon_closures using gist (period);

alter table public.salon_closures enable row level security;

create policy salon_closures_read on public.salon_closures
  for select using (true);

create policy salon_closures_owner_write on public.salon_closures
  for all
  using (salon_id = public.current_salon_id() and public.current_role_is(array['owner']::public.user_role[]))
  with check (salon_id = public.current_salon_id() and public.current_role_is(array['owner']::public.user_role[]));
