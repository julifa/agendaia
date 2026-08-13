# Backend — Motor de reservas

FastAPI + SQLAlchemy async sobre el Postgres de Supabase.

## Puesta en marcha

```bash
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
cp .env.example .env                                       # completar DATABASE_URL
.venv/Scripts/python -m uvicorn app.main:app --reload
```

Docs interactivas en `http://localhost:8000/docs`.

## Migración

El schema vive en `../supabase/migrations/`. Aplicarlo con el CLI de Supabase
(`supabase db push`) o pegando el archivo en el SQL Editor del proyecto.

## Tests

```bash
.venv/Scripts/python -m pytest
```

Los tests de `test_availability.py` stubbean el acceso a base y cubren el
algoritmo de slots. No requieren Postgres.

## Cómo se evita el double-booking

La defensa real es un `EXCLUDE USING gist` en `appointments`: dos turnos del
mismo profesional no pueden solaparse mientras estén en estado `pending` o
`confirmed`. La aplicación **no** intenta ganarle a la carrera con locks ni
transacciones serializables:

1. `availability.py` filtra horarios implausibles para dar errores legibles.
2. `bookings.create_booking` hace el INSERT.
3. Si dos requests llegan al mismo slot, Postgres deja pasar uno y devuelve
   `SQLSTATE 23P01` al otro, que se traduce a **HTTP 409**.

Consecuencia para el frontend: `GET /availability` es orientativo. Todo cliente
del API debe manejar el 409 y refrescar la grilla.

Cancelar libera el horario solo: el constraint es parcial sobre los estados
activos, así que un turno `cancelled` deja de ocupar agenda sin borrar nada.
