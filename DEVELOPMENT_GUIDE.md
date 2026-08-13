# Guía de Desarrollo: Flujo de Trabajo
**Estrategia: Usar Claude 3.5 Sonnet**

## ¿Cómo trabajar con Claude Code?
Una vez definida la arquitectura, cambia a **Sonnet** para el desarrollo iterativo. Sonnet es más rápido y eficiente para escribir código de interfaz, tests y lógica de negocio.

## Workflow Recomendado
1.  **Componentes:** Desarrollar los bloques de UI (Calendario, Formulario de Reserva).
2.  **Lógica:** Implementar los endpoints de FastAPI (`/create-booking`, `/check-availability`).
3.  **Tests:** Generar pruebas unitarias para el motor de reservas.

## Instrucción para Claude Code (Sonnet):
> "Usando la arquitectura definida en ARCHITECTURE.md, escribe el componente de React para el selector de fecha y hora del sistema de reservas. Usa TailwindCSS para el estilo. Debe ser responsivo, elegante y minimalista. Incluye validación simple de fechas pasadas."

## Tip de productividad
*   Mantén archivos pequeños.
*   Pide a Sonnet que cree los tests *después* de cada componente implementado.
*   Usa `git commit` frecuentes tras cada sección completada.
