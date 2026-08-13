"""Administración del salón: servicios, staff, horarios y ausencias.

Todas las rutas de escritura requieren sesión. Las de horarios/ausencias
aceptan tanto al owner como al propio profesional (autogestión), el resto
son exclusivas del owner.
"""

from __future__ import annotations

import datetime as dt
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_profile, require_roles
from app.core.errors import PermissionDenied, ResourceNotFound
from app.db.models import Profile, Service, TimeOff, UserRole
from app.db.session import get_session
from app.schemas.admin import (
    PublicStaffOut,
    ScheduleBlockOut,
    ScheduleReplace,
    ServiceCreate,
    ServiceOut,
    ServiceUpdate,
    StaffActiveUpdate,
    StaffOut,
    StaffServicesUpdate,
    TimeOffCreate,
    TimeOffOut,
)
from app.services import admin

router = APIRouter(tags=["administración"])


def _require_self_or_owner(profile: Profile, staff_id: uuid.UUID) -> None:
    if profile.role is not UserRole.owner and profile.id != staff_id:
        raise PermissionDenied(
            "Solo el propio profesional o el dueño del salón pueden hacer esto"
        )


# --- Services ----------------------------------------------------------------


@router.get("/services", response_model=list[ServiceOut])
async def list_services(
    salon_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> list[ServiceOut]:
    """Público a propósito: es lo que alimenta la página de reservas sin
    login. Solo devuelve servicios activos; para ver de baja usar
    `/services/mine`, que requiere sesión de owner/staff."""
    rows = await admin.list_services(session, salon_id, include_inactive=False)
    return [ServiceOut.model_validate(r) for r in rows]


@router.get("/services/mine", response_model=list[ServiceOut])
async def list_my_services(
    include_inactive: bool = True,
    profile: Profile = Depends(require_roles(UserRole.owner, UserRole.staff)),
    session: AsyncSession = Depends(get_session),
) -> list[ServiceOut]:
    rows = await admin.list_services(
        session, profile.salon_id, include_inactive=include_inactive
    )
    return [ServiceOut.model_validate(r) for r in rows]


@router.post("/services", response_model=ServiceOut, status_code=201)
async def create_service(
    payload: ServiceCreate,
    profile: Profile = Depends(require_roles(UserRole.owner)),
    session: AsyncSession = Depends(get_session),
) -> ServiceOut:
    service = await admin.create_service(session, profile.salon_id, payload)
    return ServiceOut.model_validate(service)


@router.patch("/services/{service_id}", response_model=ServiceOut)
async def update_service(
    service_id: uuid.UUID,
    payload: ServiceUpdate,
    profile: Profile = Depends(require_roles(UserRole.owner)),
    session: AsyncSession = Depends(get_session),
) -> ServiceOut:
    service = await admin.update_service(
        session, profile.salon_id, service_id, payload
    )
    return ServiceOut.model_validate(service)


@router.delete("/services/{service_id}", response_model=ServiceOut)
async def deactivate_service(
    service_id: uuid.UUID,
    profile: Profile = Depends(require_roles(UserRole.owner)),
    session: AsyncSession = Depends(get_session),
) -> ServiceOut:
    """Baja lógica (`is_active = false`). Ver docstring de
    `admin.deactivate_service` sobre por qué no es un DELETE físico."""
    service = await admin.deactivate_service(session, profile.salon_id, service_id)
    return ServiceOut.model_validate(service)


@router.get("/services/{service_id}/staff", response_model=list[PublicStaffOut])
async def list_staff_for_service(
    service_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> list[PublicStaffOut]:
    """Público: quién presta este servicio, para mostrar "con Fulana" en la
    UI de reservas y en la confirmación (el turno solo guarda el id)."""
    service = await session.get(Service, service_id)
    if service is None or not service.is_active:
        raise ResourceNotFound("Servicio inexistente", service_id=str(service_id))
    rows = await admin.list_public_staff_for_service(
        session, service.salon_id, service_id
    )
    return [PublicStaffOut.model_validate(r) for r in rows]


# --- Staff -----------------------------------------------------------------


@router.get("/staff", response_model=list[StaffOut])
async def list_staff(
    profile: Profile = Depends(require_roles(UserRole.owner, UserRole.staff)),
    session: AsyncSession = Depends(get_session),
) -> list[StaffOut]:
    rows = await admin.list_staff(session, profile.salon_id)
    return [StaffOut.model_validate(r) for r in rows]


@router.patch("/staff/{staff_id}/active", response_model=StaffOut)
async def set_staff_active(
    staff_id: uuid.UUID,
    payload: StaffActiveUpdate,
    profile: Profile = Depends(require_roles(UserRole.owner)),
    session: AsyncSession = Depends(get_session),
) -> StaffOut:
    updated = await admin.set_staff_active(
        session, profile.salon_id, staff_id, payload.is_active
    )
    return StaffOut.model_validate(updated)


@router.put("/staff/{staff_id}/services", response_model=list[uuid.UUID])
async def set_staff_services(
    staff_id: uuid.UUID,
    payload: StaffServicesUpdate,
    profile: Profile = Depends(require_roles(UserRole.owner)),
    session: AsyncSession = Depends(get_session),
) -> list[uuid.UUID]:
    return await admin.set_staff_services(
        session, profile.salon_id, staff_id, payload.service_ids
    )


# --- Horarios laborales --------------------------------------------------


@router.get("/staff/{staff_id}/schedule", response_model=list[ScheduleBlockOut])
async def get_staff_schedule(
    staff_id: uuid.UUID,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> list[ScheduleBlockOut]:
    _require_self_or_owner(profile, staff_id)
    rows = await admin.get_staff_schedule(session, profile.salon_id, staff_id)
    return [ScheduleBlockOut.model_validate(r) for r in rows]


@router.put("/staff/{staff_id}/schedule", response_model=list[ScheduleBlockOut])
async def replace_staff_schedule(
    staff_id: uuid.UUID,
    payload: ScheduleReplace,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> list[ScheduleBlockOut]:
    _require_self_or_owner(profile, staff_id)
    rows = await admin.replace_staff_schedule(
        session, profile.salon_id, staff_id, payload.blocks
    )
    return [ScheduleBlockOut.model_validate(r) for r in rows]


# --- Ausencias ---------------------------------------------------------------


@router.get("/staff/{staff_id}/time-off", response_model=list[TimeOffOut])
async def list_time_off(
    staff_id: uuid.UUID,
    date_from: dt.datetime | None = None,
    date_to: dt.datetime | None = None,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> list[TimeOffOut]:
    _require_self_or_owner(profile, staff_id)
    rows = await admin.list_time_off(
        session, profile.salon_id, staff_id, date_from, date_to
    )
    return [TimeOffOut.model_validate(r) for r in rows]


@router.post("/staff/{staff_id}/time-off", response_model=TimeOffOut, status_code=201)
async def create_time_off(
    staff_id: uuid.UUID,
    payload: TimeOffCreate,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> TimeOffOut:
    _require_self_or_owner(profile, staff_id)
    row = await admin.create_time_off(
        session,
        profile.salon_id,
        staff_id,
        payload.starts_at,
        payload.ends_at,
        payload.reason,
    )
    return TimeOffOut.model_validate(row)


@router.delete("/time-off/{time_off_id}", status_code=204)
async def delete_time_off(
    time_off_id: uuid.UUID,
    profile: Profile = Depends(get_current_profile),
    session: AsyncSession = Depends(get_session),
) -> None:
    # Se resuelve el dueño real de la ausencia antes de autorizar: un staff
    # no puede borrar la ausencia de otro staff, solo el owner puede.
    time_off = await session.get(TimeOff, time_off_id)
    if time_off is None or time_off.salon_id != profile.salon_id:
        raise ResourceNotFound(
            "Ausencia inexistente en este salón", time_off_id=str(time_off_id)
        )
    _require_self_or_owner(profile, time_off.staff_id)
    await admin.delete_time_off(session, profile.salon_id, time_off_id)
