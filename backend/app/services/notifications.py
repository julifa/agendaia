"""Notificaciones salientes (WhatsApp/Email) vía webhook.

ARCHITECTURE.md pide integrar WhatsApp/Email por webhooks. Integrar
directamente contra la API de WhatsApp Business requiere verificación de
negocio y plantillas pre-aprobadas — fuera de alcance de este backend. En su
lugar, el backend dispara un webhook genérico con la info del turno; del otro
lado (Zapier, Make, n8n, una Cloud Function propia) se decide a qué canal
mandarlo y con qué texto.

Una notificación que falla **nunca** debe tirar abajo la operación de negocio
que la disparó: se loguea y se sigue. Por eso ningún método de este módulo
propaga excepciones.
"""

from __future__ import annotations

import logging

import httpx

from app.core.config import get_settings
from app.db.models import Appointment

logger = logging.getLogger(__name__)

_TIMEOUT_SECONDS = 5.0


def _payload(event: str, appointment: Appointment, **extra: object) -> dict:
    return {
        "event": event,
        "appointment_id": str(appointment.id),
        "salon_id": str(appointment.salon_id),
        "staff_id": str(appointment.staff_id),
        "service_id": str(appointment.service_id),
        "client_id": str(appointment.client_id) if appointment.client_id else None,
        "guest_name": appointment.guest_name,
        "guest_phone": appointment.guest_phone,
        "start_time": appointment.start_time.isoformat(),
        "end_time": appointment.end_time.isoformat(),
        "status": appointment.status.value,
        **extra,
    }


async def notify(event: str, appointment: Appointment, **extra: object) -> None:
    """Dispara el webhook configurado. No-op si no hay URL configurada."""
    settings = get_settings()
    if not settings.notifications_webhook_url:
        logger.debug("notifications_webhook_url no configurado; se omite %s", event)
        return

    payload = _payload(event, appointment, **extra)
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
            response = await client.post(settings.notifications_webhook_url, json=payload)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("Falló el webhook de notificaciones (%s): %s", event, exc)
