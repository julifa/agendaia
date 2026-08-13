from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import get_current_profile
from app.db.models import Profile
from app.schemas.admin import StaffOut

router = APIRouter(tags=["perfil"])


@router.get("/me", response_model=StaffOut)
async def get_me(profile: Profile = Depends(get_current_profile)) -> StaffOut:
    """Perfil del usuario autenticado (cualquier rol)."""
    return StaffOut.model_validate(profile)
