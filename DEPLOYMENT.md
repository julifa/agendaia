# Despliegue

Ningún paso de este documento se ejecutó — son las instrucciones para
desplegar, no un registro de un despliegue ya hecho. Requiere crear cuentas y
recursos reales (Supabase, hosting), así que queda a criterio de quien lo
ejecute.

## 1. Supabase (base de datos + auth)

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. Aplicar las migraciones en orden, desde `supabase/migrations/`:
   - vía CLI: `supabase link --project-ref <ref>` y `supabase db push`, o
   - a mano: pegar cada archivo `.sql` (en orden por fecha) en el SQL Editor
     del dashboard.
3. Cargar el primer salón:
   ```sql
   insert into public.salons (name, slug) values ('MC Nails Studio', 'mc-nails-studio')
   returning id;
   ```
   Guardar el `id` devuelto — es `VITE_SALON_ID` para el frontend.
4. Project Settings -> API: copiar `URL`, `anon public key` y el `JWT Secret`.
5. Authentication -> Providers: habilitar Email (y Google si se quiere, según
   ARCHITECTURE.md).
6. Dar de alta al primer owner de cada salón: como el signup público siempre
   crea `client` (el backend fuerza esto a nivel de trigger — ver
   `supabase/migrations/20260814120000_harden_profile_writes.sql` — nadie
   puede auto-promoverse mandando `role` en el body del signup ni haciendo
   `update profiles set role = ...` directo vía PostgREST), hace falta un
   paso manual único: registrarse normalmente desde el frontend y después,
   con la `service_role` key, `update public.profiles set role = 'owner'
   where id = '...'`. Una vez que existe ese primer owner, el resto del
   staff se da de alta desde el panel (`/admin/staff` -> "Invitar"), sin
   volver a tocar la base a mano.

## 2. Backend (FastAPI)

Imagen: `backend/Dockerfile` (no se construyó ni se probó en este entorno —
no hay Docker disponible acá; probarla antes del primer deploy real).

Variables de entorno (ver `backend/.env.example`):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | connection string de Supabase, con `postgresql+asyncpg://` |
| `SUPABASE_URL` | del paso 1.4 |
| `SUPABASE_SERVICE_KEY` | service_role key (Project Settings -> API) — secreto, nunca al frontend |
| `SUPABASE_JWT_SECRET` | del paso 1.4 — sin esto, todas las rutas autenticadas devuelven 500 |
| `NOTIFICATIONS_WEBHOOK_URL` | endpoint de Zapier/Make/n8n/Cloud Function que reciba los eventos de turno |
| `CORS_ORIGINS` | `["https://tu-dominio-frontend"]` |

Targets sugeridos (cualquiera sirve con un `Dockerfile` estándar): Fly.io,
Render, Railway. Health check del contenedor: `GET /health` (ya lo usa el
`HEALTHCHECK` del Dockerfile).

## 3. Frontend (React/Vite)

Variables de entorno (ver `frontend/.env.example`): `VITE_API_URL`,
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SALON_ID`.

Build: `npm run build` → sirve el contenido de `frontend/dist/` como sitio
estático. Vercel o Netlify detectan Vite automáticamente (build command
`npm run build`, output `dist`).

## 4. Orden y smoke test

1. Supabase arriba y migrado.
2. Backend desplegado, apuntando a Supabase → `curl https://.../health` debe
   dar `{"status":"ok"}`.
3. Frontend desplegado, apuntando al backend.
4. Probar el flujo completo: cargar un servicio vía API (o a mano en
   Supabase), reservar como invitado desde el frontend, confirmar que el
   turno aparece en `appointments` con el estado esperado.

## Lo que falta para que esto sea un despliegue real

- **CI no publica la imagen todavía.** `.github/workflows/ci.yml` corre tests,
  no hace `docker build`/`push`. Agregar ese paso (y el login al registry
  elegido) cuando se decida el hosting.
- **`backend/Dockerfile` no se probó nunca de punta a punta.** El contenido es
  correcto por inspección (base `python:3.14-slim`, healthcheck, usuario no
  root) pero no hay Docker disponible en el entorno donde se escribió este
  repo hasta ahora — construirla y correrla al menos una vez antes del primer
  deploy real.
- **Sin backups verificados.** Supabase hace backups automáticos según el
  plan contratado; vale la pena confirmar la política antes de depender de
  esto en producción.
