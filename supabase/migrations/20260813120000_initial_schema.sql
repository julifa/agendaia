-- =============================================================================
-- MC Nails Studio — Schema inicial
-- Prioridad: integridad referencial y ausencia de double-booking a nivel de BD.
--
-- Reglas duras que garantiza este archivo (no la aplicación):
--   1. Un profesional no puede tener dos turnos activos solapados  -> EXCLUDE gist
--   2. Un turno no puede mezclar datos de dos salones distintos    -> FK compuestas
--   3. Un profesional solo puede ser reservado para servicios que ofrece
--   4. end_time siempre = start_time + duration_minutes
-- =============================================================================

create extension if not exists "btree_gist";
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('owner', 'staff', 'client');

create type public.appointment_status as enum (
  'pending',    -- creado, esperando confirmación
  'confirmed',  -- confirmado por el salón
  'completed',  -- atendido
  'cancelled',  -- cancelado por cliente o salón
  'no_show'     -- el cliente no se presentó
);

-- Postgres no trae un range type sobre `time`; lo necesitamos para el EXCLUDE
-- de horarios laborales semanales.
create type public.timerange as range (subtype = time);

-- -----------------------------------------------------------------------------
-- salons
-- -----------------------------------------------------------------------------
create table public.salons (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null check (length(trim(name)) > 0),
  slug          text        not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  timezone      text        not null default 'America/Argentina/Buenos_Aires',
  phone         text,
  -- Anticipación mínima y máxima con la que se puede reservar.
  min_lead_minutes  integer not null default 60  check (min_lead_minutes >= 0),
  max_advance_days  integer not null default 60  check (max_advance_days between 1 and 365),
  -- Granularidad de la grilla de horarios ofrecida al cliente.
  slot_step_minutes integer not null default 15  check (slot_step_minutes between 5 and 120),
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.salons.timezone is
  'IANA tz. Los horarios laborales se interpretan en esta zona; los turnos se guardan en UTC.';

-- -----------------------------------------------------------------------------
-- profiles  (1:1 con auth.users de Supabase)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  salon_id     uuid not null references public.salons (id) on delete restrict,
  role         public.user_role not null default 'client',
  full_name    text not null check (length(trim(full_name)) > 0),
  email        text,
  phone        text,
  avatar_url   text,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- Necesario para las FK compuestas que amarran todo al mismo salón.
  constraint profiles_id_salon_key unique (id, salon_id)
);

create index profiles_salon_role_idx on public.profiles (salon_id, role) where is_active;

-- -----------------------------------------------------------------------------
-- services
-- -----------------------------------------------------------------------------
create table public.services (
  id               uuid primary key default gen_random_uuid(),
  salon_id         uuid not null references public.salons (id) on delete cascade,
  name             text not null check (length(trim(name)) > 0),
  description      text,
  duration_minutes integer not null check (duration_minutes between 5 and 600),
  -- Colchón de limpieza/preparación que ocupa agenda pero no se cobra.
  buffer_minutes   integer not null default 0 check (buffer_minutes between 0 and 120),
  price            numeric(10, 2) not null check (price >= 0),
  currency         char(3) not null default 'ARS',
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint services_salon_name_key unique (salon_id, name),
  constraint services_id_salon_key   unique (id, salon_id)
);

create index services_salon_active_idx on public.services (salon_id) where is_active;

-- -----------------------------------------------------------------------------
-- staff_services — qué profesional puede prestar qué servicio
-- Las FK compuestas impiden vincular un profesional del salón A con un
-- servicio del salón B.
-- -----------------------------------------------------------------------------
create table public.staff_services (
  salon_id   uuid not null references public.salons (id) on delete cascade,
  staff_id   uuid not null,
  service_id uuid not null,
  created_at timestamptz not null default now(),

  primary key (staff_id, service_id),
  constraint staff_services_staff_fk foreign key (staff_id, salon_id)
    references public.profiles (id, salon_id) on delete cascade,
  constraint staff_services_service_fk foreign key (service_id, salon_id)
    references public.services (id, salon_id) on delete cascade
);

create index staff_services_service_idx on public.staff_services (service_id);

-- Un `client` no puede figurar como prestador de servicios.
create or replace function public.enforce_staff_role()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = new.staff_id and p.role in ('owner', 'staff')
  ) then
    raise exception 'profile % no tiene rol owner/staff', new.staff_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger staff_services_role_check
  before insert or update on public.staff_services
  for each row execute function public.enforce_staff_role();

-- -----------------------------------------------------------------------------
-- staff_schedules — horario laboral semanal recurrente
-- -----------------------------------------------------------------------------
create table public.staff_schedules (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references public.salons (id) on delete cascade,
  staff_id    uuid not null,
  weekday     smallint not null check (weekday between 0 and 6), -- 0 = lunes
  start_time  time not null,
  end_time    time not null,
  created_at  timestamptz not null default now(),

  constraint staff_schedules_order_check check (end_time > start_time),
  constraint staff_schedules_staff_fk foreign key (staff_id, salon_id)
    references public.profiles (id, salon_id) on delete cascade,
  -- Dos bloques del mismo día no pueden solaparse (sí pueden ser disjuntos,
  -- p. ej. mañana y tarde con corte al mediodía).
  constraint staff_schedules_no_overlap exclude using gist (
    staff_id  with =,
    weekday   with =,
    public.timerange(start_time, end_time, '[)') with &&
  )
);

comment on column public.staff_schedules.weekday is
  '0=lunes ... 6=domingo (ISO, coincide con Python date.weekday()).';

create index staff_schedules_lookup_idx on public.staff_schedules (staff_id, weekday);

-- -----------------------------------------------------------------------------
-- time_off — ausencias puntuales (vacaciones, feriados, licencias)
-- -----------------------------------------------------------------------------
create table public.time_off (
  id         uuid primary key default gen_random_uuid(),
  salon_id   uuid not null references public.salons (id) on delete cascade,
  staff_id   uuid not null,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  reason     text,
  created_at timestamptz not null default now(),

  period tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,

  constraint time_off_order_check check (ends_at > starts_at),
  constraint time_off_staff_fk foreign key (staff_id, salon_id)
    references public.profiles (id, salon_id) on delete cascade,
  constraint time_off_no_overlap exclude using gist (
    staff_id with =,
    period   with &&
  )
);

create index time_off_period_idx on public.time_off using gist (period);

-- -----------------------------------------------------------------------------
-- appointments — el corazón del sistema
-- -----------------------------------------------------------------------------
create table public.appointments (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references public.salons (id) on delete restrict,

  -- Cliente registrado. Nullable para permitir walk-ins cargados por el salón,
  -- pero el CHECK de abajo exige identificación por una vía u otra.
  client_id   uuid,
  guest_name  text,
  guest_phone text,

  staff_id    uuid not null,
  service_id  uuid not null,

  start_time  timestamptz not null,
  end_time    timestamptz not null,

  -- Congelamos duración y precio: si mañana cambia el servicio, el histórico
  -- del turno no debe mutar.
  duration_minutes integer not null check (duration_minutes > 0),
  price            numeric(10, 2) not null check (price >= 0),
  currency         char(3) not null default 'ARS',

  status      public.appointment_status not null default 'pending',
  notes       text,
  cancelled_at     timestamptz,
  cancellation_reason text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  time_range tstzrange generated always as (
    tstzrange(start_time, end_time, '[)')
  ) stored,

  -- --- Integridad de datos ---------------------------------------------------
  constraint appointments_time_order_check check (end_time > start_time),
  constraint appointments_duration_match_check
    check (end_time = start_time + make_interval(mins => duration_minutes)),
  constraint appointments_client_identified_check check (
    client_id is not null
    or (guest_name is not null and length(trim(guest_name)) > 0)
  ),
  constraint appointments_cancel_consistency_check check (
    (status = 'cancelled') = (cancelled_at is not null)
  ),

  -- --- Integridad referencial (todo dentro del mismo salón) ------------------
  constraint appointments_client_fk foreign key (client_id, salon_id)
    references public.profiles (id, salon_id) on delete restrict,
  constraint appointments_staff_fk foreign key (staff_id, salon_id)
    references public.profiles (id, salon_id) on delete restrict,
  constraint appointments_service_fk foreign key (service_id, salon_id)
    references public.services (id, salon_id) on delete restrict,

  -- --- Anti double-booking ---------------------------------------------------
  -- Constraint de exclusión parcial: dos turnos del mismo profesional no pueden
  -- solaparse mientras estén 'pending' o 'confirmed'. Al cancelar, el hueco se
  -- libera automáticamente. Esto es lo que hace segura la concurrencia: dos
  -- requests simultáneos por el mismo slot -> uno commitea, el otro recibe
  -- SQLSTATE 23P01.
  constraint appointments_no_double_booking exclude using gist (
    staff_id   with =,
    time_range with &&
  ) where (status in ('pending', 'confirmed')),

  -- Simétrico del lado del cliente: nadie puede estar en dos turnos a la vez.
  -- Las filas con client_id NULL (walk-ins) quedan fuera del constraint, que es
  -- exactamente lo que queremos.
  constraint appointments_client_no_overlap exclude using gist (
    client_id  with =,
    time_range with &&
  ) where (status in ('pending', 'confirmed'))
);

create index appointments_staff_range_idx
  on public.appointments using gist (staff_id, time_range);
create index appointments_salon_start_idx
  on public.appointments (salon_id, start_time desc);
create index appointments_client_idx
  on public.appointments (client_id, start_time desc);

-- Un turno solo puede asignarse a un profesional habilitado para ese servicio.
create or replace function public.enforce_staff_offers_service()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.staff_services ss
    where ss.staff_id = new.staff_id
      and ss.service_id = new.service_id
  ) then
    raise exception 'el profesional % no presta el servicio %',
      new.staff_id, new.service_id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger appointments_staff_offers_service
  before insert or update of staff_id, service_id on public.appointments
  for each row execute function public.enforce_staff_offers_service();

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['salons', 'profiles', 'services', 'appointments'] loop
    execute format(
      'create trigger %I_touch_updated_at before update on public.%I
         for each row execute function public.touch_updated_at()', t, t);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Alta automática de profile al registrarse en Supabase Auth
-- Requiere que el signup mande salon_id en raw_user_meta_data.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, salon_id, role, full_name, email)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'salon_id')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'client'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
create or replace function public.current_salon_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select salon_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role_is(roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = any(roles)
  );
$$;

alter table public.salons          enable row level security;
alter table public.profiles        enable row level security;
alter table public.services        enable row level security;
alter table public.staff_services  enable row level security;
alter table public.staff_schedules enable row level security;
alter table public.time_off        enable row level security;
alter table public.appointments    enable row level security;

-- Catálogo público: cualquiera puede ver salones y servicios activos
-- (necesario para la página de reservas sin login).
create policy salons_public_read on public.salons
  for select using (is_active);

create policy services_public_read on public.services
  for select using (is_active);

create policy services_staff_write on public.services
  for all
  using (salon_id = public.current_salon_id() and public.current_role_is(array['owner']::public.user_role[]))
  with check (salon_id = public.current_salon_id() and public.current_role_is(array['owner']::public.user_role[]));

create policy profiles_self_read on public.profiles
  for select using (
    id = auth.uid()
    or (salon_id = public.current_salon_id()
        and public.current_role_is(array['owner', 'staff']::public.user_role[]))
  );

create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy staff_services_read on public.staff_services
  for select using (true);

create policy staff_services_owner_write on public.staff_services
  for all
  using (salon_id = public.current_salon_id() and public.current_role_is(array['owner']::public.user_role[]))
  with check (salon_id = public.current_salon_id() and public.current_role_is(array['owner']::public.user_role[]));

create policy staff_schedules_read on public.staff_schedules
  for select using (true);

create policy staff_schedules_write on public.staff_schedules
  for all
  using (salon_id = public.current_salon_id()
         and (staff_id = auth.uid() or public.current_role_is(array['owner']::public.user_role[])))
  with check (salon_id = public.current_salon_id()
         and (staff_id = auth.uid() or public.current_role_is(array['owner']::public.user_role[])));

create policy time_off_write on public.time_off
  for all
  using (salon_id = public.current_salon_id()
         and (staff_id = auth.uid() or public.current_role_is(array['owner']::public.user_role[])))
  with check (salon_id = public.current_salon_id()
         and (staff_id = auth.uid() or public.current_role_is(array['owner']::public.user_role[])));

-- Turnos: el cliente ve los suyos; el staff ve los de su salón.
create policy appointments_read on public.appointments
  for select using (
    client_id = auth.uid()
    or (salon_id = public.current_salon_id()
        and public.current_role_is(array['owner', 'staff']::public.user_role[]))
  );

create policy appointments_client_insert on public.appointments
  for insert with check (
    client_id = auth.uid()
    or (salon_id = public.current_salon_id()
        and public.current_role_is(array['owner', 'staff']::public.user_role[]))
  );

create policy appointments_update on public.appointments
  for update using (
    client_id = auth.uid()
    or (salon_id = public.current_salon_id()
        and public.current_role_is(array['owner', 'staff']::public.user_role[]))
  );

-- Los turnos no se borran, se cancelan. Sin policy de DELETE nadie puede
-- borrarlos vía PostgREST (el backend usa service_role, que bypassea RLS).

-- =============================================================================
-- Vista de disponibilidad ocupada — usada por el motor de slots
-- =============================================================================
create or replace view public.busy_intervals
with (security_invoker = true)
as
  select staff_id, salon_id, time_range as period, 'appointment'::text as source
  from public.appointments
  where status in ('pending', 'confirmed')
  union all
  select staff_id, salon_id, period, 'time_off'::text as source
  from public.time_off;
