-- Stand-in mínimo de lo que Supabase Auth normalmente provee (schema `auth`,
-- tabla `users`). Solo para levantar Postgres local sin el stack completo de
-- Supabase y poder aplicar las migraciones de public.* tal cual están.
-- NO USAR en un proyecto Supabase real: ahí `auth.users` ya existe.
create schema if not exists auth;

create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

-- Supabase inyecta esto vía PostgREST a partir del JWT de la request. Acá
-- no hay PostgREST corriendo, así que el stub devuelve NULL siempre: alcanza
-- para que la migración compile (RLS no la ejerce el backend, que se conecta
-- directo con un rol equivalente a service_role).
create or replace function auth.uid() returns uuid
language sql stable
as $$ select null::uuid $$;
