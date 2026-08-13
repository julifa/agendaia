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

## Tests

```bash
npm test   # vitest, jsdom
```

Cubre lógica de presentación (`mappers.ts`), el componente `BookingCard`, y
el guard de acceso de `AdminLayout` (con `useAuth`/`useProfile` mockeados —
sin login real ni llamadas de red).

## Estructura

- `src/hooks/useAuth.tsx` — sesión de Supabase Auth (login/signup/logout).
- `src/hooks/useProfile.tsx` — perfil del backend (`GET /me`: rol, salón).
- `src/lib/api.ts` — cliente HTTP hacia el backend; adjunta el JWT de Supabase
  como `Authorization: Bearer` automáticamente.
- `src/lib/mappers.ts` — traduce las respuestas de la API (ids, snake_case,
  `price` como string) al modelo de presentación que consume `BookingCard`.
- `src/pages/PublicSite.tsx` + `src/components/BookingFlow.tsx` — sitio
  público: servicio -> fecha/hora -> invitado o logueado -> confirmación.
- `src/admin/` — panel del salón (`/admin/*`), protegido por sesión + rol
  owner/staff: agenda del día, servicios, staff y horarios.

## Cuenta de owner/staff

No hay signup público para roles owner/staff a propósito (el registro del
sitio público siempre crea clientes). Para dar de alta al dueño o a un
profesional hoy hace falta insertar el perfil a mano en Supabase — ver
`../DEPLOYMENT.md`. Una pantalla de invitación es trabajo pendiente.
