# Arquitectura: MC Nails Studio - Agenda Automática
**Estrategia: Usar Claude 3.5 Opus**

## Propósito
Este documento define la estructura lógica y la infraestructura del sistema. El objetivo es crear una solución SaaS escalable para la gestión de turnos.

## Stack Tecnológico Recomendado
*   **Backend:** FastAPI (Python) - Alta performance para el motor de reservas.
*   **Frontend:** React + TailwindCSS - Interfaz rápida y elegante.
*   **Base de Datos:** Supabase (PostgreSQL) - Gestión de usuarios y disponibilidad en tiempo real.
*   **Autenticación:** Supabase Auth (Google/Email).

## Componentes Críticos (Planificación con Opus)
1.  **Motor de Disponibilidad:** Algoritmo de validación de turnos concurrentes (evitar *double-booking*).
2.  **Schema de Base de Datos:**
    *   `profiles`: (ID, role, salon_id)
    *   `services`: (name, duration, price)
    *   `appointments`: (client_id, service_id, start_time, end_time, status)
3.  **Integración:** Webhooks para notificaciones vía WhatsApp/Email.

## Instrucción para Claude Code (Opus):
> "Actúa como un Senior Solutions Architect. Diseña el esquema de base de datos relacional para una aplicación de reservas de manicura que maneje servicios, disponibilidad de empleados y clientes. Enfócate en integridad de datos para evitar doble reserva. Genera el código SQL para Supabase y explica la lógica de la API de disponibilidad."
