"""Gestión del catálogo del salón: servicios, staff, horarios y ausencias.

Todo acá se filtra por `salon_id` explícito en cada consulta (nunca "traé por
id y confiá") para que un id adivinado o filtrado de otro salón nunca sea
alcanzable, ni por accidente.
"""

from __future__ import annotations

import datetime as dt
import uuid

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, ResourceNotFound
from app.db.models import (
    Profile,
    Service,
    StaffSchedule,
    StaffService,
    TimeOff,
    UserRole,
)
from app.schemas.admin import ScheduleBlockIn, ServiceCreate, ServiceUpdate

_STAFF_ROLES = (UserRole.owner, UserRole.staff)


# --- Services ----------------------------------------------------------------


async def list_services(
    session: AsyncSession, salon_id: uuid.UUID, include_inactive: bool = False
) -> list[Service]:
    stmt = select(Service).where(Service.salon_id == salon_id)
    if not include_inactive:
        stmt = stmt.where(Service.is_active.is_(True))
    stmt = stmt.order_by(Service.name)
    return list((await session.scalars(stmt)).all())


async def _load_service(
    session: AsyncSession, salon_id: uuid.UUID, service_id: uuid.UUID
) -> Service:
    service = await session.get(Service, service_id)
    if service is None or service.salon_id != salon_id:
        raise ResourceNotFound("Servicio inexistente", service_id=str(service_id))
    return service


async def create_service(
    session: AsyncSession, salon_id: uuid.UUID, data: ServiceCreate
) -> Service:
    service = Service(salon_id=salon_id, **data.model_dump())
    session.add(service)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        if "services_salon_name_key" in str(getattr(exc, "orig", exc)):
            raise ConflictError(
                f"Ya existe un servicio llamado '{data.name}' en este salón"
            ) from exc
        raise
    await session.refresh(service)
    return service


async def update_service(
    session: AsyncSession,
    salon_id: uuid.UUID,
    service_id: uuid.UUID,
    data: ServiceUpdate,
) -> Service:
    service = await _load_service(session, salon_id, service_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(service, field, value)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        if "services_salon_name_key" in str(getattr(exc, "orig", exc)):
            raise ConflictError("Ya existe un servicio con ese nombre") from exc
        raise
    await session.refresh(service)
    return service


async def deactivate_service(
    session: AsyncSession, salon_id: uuid.UUID, service_id: uuid.UUID
) -> Service:
    """Baja lógica: los turnos históricos referencian el servicio con
    `ON DELETE RESTRICT`, así que un DELETE físico fallaría en cuanto exista
    al menos un turno. Desactivar es la operación real de "borrar" acá.
    """
    service = await _load_service(session, salon_id, service_id)
    service.is_active = False
    await session.commit()
    await session.refresh(service)
    return service


# --- Staff ---------------------------------------------------------------


async def list_staff(session: AsyncSession, salon_id: uuid.UUID) -> list[Profile]:
    stmt = (
        select(Profile)
        .where(Profile.salon_id == salon_id, Profile.role.in_(_STAFF_ROLES))
        .order_by(Profile.full_name)
    )
    return list((await session.scalars(stmt)).all())


async def load_staff_profile(
    session: AsyncSession, salon_id: uuid.UUID, staff_id: uuid.UUID
) -> Profile:
    profile = await session.get(Profile, staff_id)
    if (
        profile is None
        or profile.salon_id != salon_id
        or profile.role not in _STAFF_ROLES
    ):
        raise ResourceNotFound(
            "Profesional inexistente en este salón", staff_id=str(staff_id)
        )
    return profile


async def list_public_staff_for_service(
    session: AsyncSession, salon_id: uuid.UUID, service_id: uuid.UUID
) -> list[Profile]:
    """Staff activo habilitado para un servicio, para mostrar en la UI de
    reservas ("con Fulana"). Público: no expone email/phone/role."""
    stmt = (
        select(Profile)
        .join(StaffService, StaffService.staff_id == Profile.id)
        .where(
            StaffService.service_id == service_id,
            Profile.salon_id == salon_id,
            Profile.is_active.is_(True),
        )
        .order_by(Profile.full_name)
    )
    return list((await session.scalars(stmt)).all())


async def set_staff_active(
    session: AsyncSession, salon_id: uuid.UUID, staff_id: uuid.UUID, is_active: bool
) -> Profile:
    profile = await load_staff_profile(session, salon_id, staff_id)
    profile.is_active = is_active
    await session.commit()
    await session.refresh(profile)
    return profile


async def set_staff_services(
    session: AsyncSession,
    salon_id: uuid.UUID,
    staff_id: uuid.UUID,
    service_ids: list[uuid.UUID],
) -> list[uuid.UUID]:
    await load_staff_profile(session, salon_id, staff_id)

    unique_ids = list(dict.fromkeys(service_ids))  # preserva orden, sin duplicados
    if unique_ids:
        owned = set(
            await session.scalars(
                select(Service.id).where(
                    Service.id.in_(unique_ids), Service.salon_id == salon_id
                )
            )
        )
        missing = set(unique_ids) - owned
        if missing:
            raise ResourceNotFound(
                "Alguno de los servicios no pertenece a este salón",
                service_ids=[str(i) for i in missing],
            )

    await session.execute(
        delete(StaffService).where(StaffService.staff_id == staff_id)
    )
    for service_id in unique_ids:
        session.add(
            StaffService(salon_id=salon_id, staff_id=staff_id, service_id=service_id)
        )
    await session.commit()
    return unique_ids


# --- Horarios laborales --------------------------------------------------


async def get_staff_schedule(
    session: AsyncSession, salon_id: uuid.UUID, staff_id: uuid.UUID
) -> list[StaffSchedule]:
    await load_staff_profile(session, salon_id, staff_id)
    stmt = (
        select(StaffSchedule)
        .where(StaffSchedule.staff_id == staff_id)
        .order_by(StaffSchedule.weekday, StaffSchedule.start_time)
    )
    return list((await session.scalars(stmt)).all())


async def replace_staff_schedule(
    session: AsyncSession,
    salon_id: uuid.UUID,
    staff_id: uuid.UUID,
    blocks: list[ScheduleBlockIn],
) -> list[StaffSchedule]:
    """Reemplaza toda la semana de una vez: borra los bloques actuales e
    inserta los nuevos en la misma transacción. Simplifica la operación
    (sin diffing) a costa de exigirle al cliente mandar la semana completa
    cada vez que edita un solo bloque.
    """
    await load_staff_profile(session, salon_id, staff_id)

    await session.execute(
        delete(StaffSchedule).where(StaffSchedule.staff_id == staff_id)
    )
    rows = [
        StaffSchedule(
            salon_id=salon_id,
            staff_id=staff_id,
            weekday=b.weekday,
            start_time=b.start_time,
            end_time=b.end_time,
        )
        for b in blocks
    ]
    session.add_all(rows)

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        if "staff_schedules_no_overlap" in str(getattr(exc, "orig", exc)):
            raise ConflictError(
                "Hay bloques de horario que se superponen el mismo día"
            ) from exc
        raise

    return await get_staff_schedule(session, salon_id, staff_id)


# --- Ausencias -------------------------------------------------------------


async def list_time_off(
    session: AsyncSession,
    salon_id: uuid.UUID,
    staff_id: uuid.UUID,
    date_from: dt.datetime | None = None,
    date_to: dt.datetime | None = None,
) -> list[TimeOff]:
    await load_staff_profile(session, salon_id, staff_id)
    stmt = select(TimeOff).where(TimeOff.staff_id == staff_id)
    if date_from is not None:
        stmt = stmt.where(TimeOff.ends_at > date_from)
    if date_to is not None:
        stmt = stmt.where(TimeOff.starts_at < date_to)
    stmt = stmt.order_by(TimeOff.starts_at)
    return list((await session.scalars(stmt)).all())


async def create_time_off(
    session: AsyncSession,
    salon_id: uuid.UUID,
    staff_id: uuid.UUID,
    starts_at: dt.datetime,
    ends_at: dt.datetime,
    reason: str | None,
) -> TimeOff:
    await load_staff_profile(session, salon_id, staff_id)

    time_off = TimeOff(
        salon_id=salon_id,
        staff_id=staff_id,
        starts_at=starts_at,
        ends_at=ends_at,
        reason=reason,
    )
    session.add(time_off)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        if "time_off_no_overlap" in str(getattr(exc, "orig", exc)):
            raise ConflictError(
                "Ya existe una ausencia cargada que se superpone con este rango"
            ) from exc
        raise
    await session.refresh(time_off)
    return time_off


async def delete_time_off(
    session: AsyncSession, salon_id: uuid.UUID, time_off_id: uuid.UUID
) -> None:
    time_off = await session.get(TimeOff, time_off_id)
    if time_off is None or time_off.salon_id != salon_id:
        raise ResourceNotFound(
            "Ausencia inexistente en este salón", time_off_id=str(time_off_id)
        )
    await session.delete(time_off)
    await session.commit()
