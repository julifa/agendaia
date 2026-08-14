-- =============================================================================
-- Email opcional del invitado en appointments.
--
-- Solo aplica a reservas de invitado (sin cuenta): permite ofrecerle sumar el
-- turno a su calendario (.ics) en la pantalla de confirmación. Los turnos de
-- clientes registrados usan el email del `profile`, no necesitan este campo.
-- =============================================================================

alter table public.appointments
  add column guest_email text;
