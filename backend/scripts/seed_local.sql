-- Seed mínimo para probar el flujo real de reservas contra Postgres local.
\set ON_ERROR_STOP on

insert into public.salons (id, name, slug, timezone, min_lead_minutes, max_advance_days, slot_step_minutes)
values ('11111111-1111-1111-1111-111111111111', 'MC Nails Studio', 'mc-nails-studio',
        'America/Argentina/Buenos_Aires', 60, 60, 30);

-- Insertar en auth.users dispara el trigger handle_new_user, que crea la
-- fila en public.profiles automáticamente (igual que en Supabase real).
insert into auth.users (id, email, raw_user_meta_data)
values (
  '22222222-2222-2222-2222-222222222222',
  'dueña@mcnails.test',
  jsonb_build_object('salon_id', '11111111-1111-1111-1111-111111111111', 'role', 'owner', 'full_name', 'Camila Dueña')
);

insert into auth.users (id, email, raw_user_meta_data)
values (
  '33333333-3333-3333-3333-333333333333',
  'valentina@mcnails.test',
  jsonb_build_object('salon_id', '11111111-1111-1111-1111-111111111111', 'role', 'staff', 'full_name', 'Valentina Profesional')
);

insert into public.services (id, salon_id, name, duration_minutes, buffer_minutes, price, currency)
values (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'Manicura Semipermanente', 60, 0, 12000, 'ARS'
);

insert into public.staff_services (salon_id, staff_id, service_id)
values (
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

-- Lunes a viernes, 09:00 a 18:00.
insert into public.staff_schedules (salon_id, staff_id, weekday, start_time, end_time)
select '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', d, '09:00', '18:00'
from generate_series(0, 4) as d;

select 'seed ok' as status;
