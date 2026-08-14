-- =============================================================================
-- Campos de pago de seña (Mercado Pago / efectivo) en appointments.
--
-- `deposit_amount` se congela al momento de reservar (mismo criterio que
-- `price`/`duration_minutes`: si mañana cambia el monto de seña configurado,
-- el histórico no debe mutar). `payment_status` es independiente del
-- `status` del turno: un turno puede quedar 'pending' con la seña ya 'paid'
-- (mercadopago) o 'unpaid' (efectivo, se cobra en el salón).
-- =============================================================================

create type public.payment_method as enum ('cash', 'mercadopago');
create type public.payment_status as enum ('unpaid', 'pending', 'paid');

alter table public.appointments
  add column payment_method public.payment_method,
  add column payment_status public.payment_status not null default 'unpaid',
  add column deposit_amount numeric(10, 2) check (deposit_amount >= 0),
  add column mp_preference_id text,
  add column mp_payment_id text;

comment on column public.appointments.payment_status is
  'Estado de la seña, independiente del status del turno. ''pending'' = preferencia de Mercado Pago generada, esperando acreditación.';
comment on column public.appointments.deposit_amount is
  'Monto de seña vigente al momento de reservar. NULL para turnos cargados por el salón sin política de seña.';
