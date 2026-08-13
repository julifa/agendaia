# Frontend — MC Nails Studio

React 19 + TypeScript + Vite + Tailwind v4. Estilos definidos en
`../BRAND_DESIGN.md`, tokens en `src/index.css` (`@theme`).

## Puesta en marcha

```bash
npm install
cp .env.example .env   # completar VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SALON_ID
npm run dev
```

`VITE_SALON_ID` es el id de la fila en `salons` que atiende esta instancia del
frontend (MVP de un solo salón: no hay selector de salón en la UI).

## Build

```bash
npm run build   # type-check (tsc -b) + build de producción a dist/
```

## Estructura

- `src/hooks/useAuth.tsx` — sesión de Supabase Auth (login/signup/logout).
- `src/lib/api.ts` — cliente HTTP hacia el backend; adjunta el JWT de Supabase
  como `Authorization: Bearer` automáticamente.
- `src/lib/mappers.ts` — traduce las respuestas de la API (ids, snake_case) al
  modelo de presentación que consume `BookingCard`.
- `src/components/BookingFlow.tsx` — flujo completo: servicio -> fecha/hora ->
  datos del invitado (si no hay sesión) -> confirmación.
- `src/components/BookingCard.tsx` — tarjeta de turno, reutilizable.

## Qué falta para un panel de administración

Hoy solo existe la vista pública de reservas. El backend ya expone los
endpoints de administración (`/services`, `/staff`, horarios, ausencias —
ver `../backend/app/api/routes/admin.py`), pero no hay pantallas para el
dueño del salón todavía. Es el próximo bloque de UI a construir.
