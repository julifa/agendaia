"""Mail de confirmación de turno con el evento adjunto (.ics), vía Resend.

Mismo criterio que app/services/payments.py: una integración externa
opcional nunca debe romper la reserva. Si RESEND_API_KEY no está
configurado, o Resend responde error, se loguea y se sigue — el turno ya
quedó guardado antes de intentar esto.
"""

from __future__ import annotations

import base64
import logging

import httpx

from app.core.config import get_settings
from app.db.models import Appointment
from app.services.calendar import build_booking_ics

logger = logging.getLogger(__name__)

_TIMEOUT_SECONDS = 10.0


async def send_booking_confirmation(appointment: Appointment, service_name: str) -> None:
    """Manda el mail con el turno adjunto al email del invitado, si lo dejó.

    No-op silencioso si no hay email o Resend no está configurado — no
    levanta excepción en ningún caso, se llama de forma "fire and forget"
    después de que la reserva ya está confirmada.
    """
    settings = get_settings()
    if not appointment.guest_email or not settings.resend_api_key:
        return

    ics = build_booking_ics(appointment, service_name, settings.resend_from_email)
    greeting = f" {appointment.guest_name}" if appointment.guest_name else ""
    body = {
        "from": f"MC Nails Studio <{settings.resend_from_email}>",
        "to": [appointment.guest_email],
        "subject": f"Tu turno en MC Nails Studio — {service_name}",
        "html": (
            f"<p>¡Hola{greeting}!</p>"
            f"<p>Confirmamos tu turno de <strong>{service_name}</strong>. "
            "Te adjuntamos el evento para que lo sumes a tu calendario.</p>"
        ),
        "attachments": [
            {
                "filename": "turno-mc-nails-studio.ics",
                "content": base64.b64encode(ics.encode("utf-8")).decode("ascii"),
            }
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                json=body,
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            )
        if response.status_code >= 400:
            logger.warning(
                "Resend rechazó el mail de confirmación del turno %s: %s",
                appointment.id,
                response.text,
            )
    except httpx.HTTPError:
        logger.exception(
            "No se pudo mandar el mail de confirmación del turno %s", appointment.id
        )
