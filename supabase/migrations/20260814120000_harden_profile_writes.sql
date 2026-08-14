-- =============================================================================
-- Endurecer la escritura de `profiles`: cierra dos vías de escalación de
-- privilegios que existían desde el schema inicial.
--
--   1. `handle_new_user()` leía `role` directo de `raw_user_meta_data`, un
--      campo que controla el propio cliente en el body del signup público de
--      Supabase Auth. El frontend manda siempre `role: "client"`, pero eso no
--      es una barrera: el endpoint de signup es público y nada impide llamarlo
--      directo con `data: { role: "owner", salon_id: "<id real>" }`.
--   2. La policy `profiles_self_update` (`using (id = auth.uid())`) no
--      restringe columnas: un cliente logueado puede pegarle directo a
--      PostgREST (`update profiles set role = 'owner' where id = auth.uid()`)
--      sin pasar por el trigger de signup para nada.
--
-- El fix cierra ambas por separado porque son independientes entre sí.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- (1) El signup nunca decide el rol. Siempre nace 'client'; `salon_id` y
-- `full_name` se siguen tomando del metadata (necesarios para el signup
-- público normal — un `salon_id` falso como mucho crea un `client` ruidoso
-- en un salón ajeno, no una escalación de rol).
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
    'client',
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- (2) Nadie autenticado vía PostgREST puede tocar su propio `role`,
-- `salon_id` o `is_active`, sin importar qué le permita la policy de UPDATE.
--
-- `auth.uid()` solo resuelve algo cuando la escritura viene de PostgREST con
-- un JWT de usuario (lee `request.jwt.claim.sub`, que PostgREST setea por
-- request). El backend se conecta directo a Postgres con un rol que
-- bypassea RLS (ver `backend/app/api/deps.py`) y nunca setea esa claim, así
-- que `auth.uid()` da NULL ahí y este trigger no le afecta: `set_staff_active`
-- y el alta de staff/owner por invitación siguen funcionando igual.
-- -----------------------------------------------------------------------------
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and (
    new.role is distinct from old.role or
    new.salon_id is distinct from old.salon_id or
    new.is_active is distinct from old.is_active
  ) then
    raise exception 'No podés modificar tu rol, salón o estado de actividad'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_privilege_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_privilege_escalation();
