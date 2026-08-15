-- =============================================================================
-- Nuevo método de pago: transferencia bancaria directa (reemplaza a efectivo
-- y Mercado Pago Checkout Pro como única opción en la reserva pública).
--
-- No se quitan 'cash' ni 'mercadopago' del enum -- Postgres no permite borrar
-- valores de un enum sin recrear el tipo, y los turnos históricos ya los
-- usan. Simplemente dejan de ofrecerse en el frontend.
-- =============================================================================

alter type public.payment_method add value 'transfer';
