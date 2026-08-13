"""Verificación de JWT de Supabase Auth.

Supabase firma los tokens de sesión con HS256 usando el JWT secret del
proyecto (Project Settings -> API -> JWT Settings). El `aud` estándar para
usuarios logueados es `"authenticated"`.
"""

from __future__ import annotations

import jwt

from app.core.config import get_settings


class InvalidTokenError(Exception):
    pass


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        # Falta de configuración, no del cliente: no tiene sentido devolver 401.
        raise RuntimeError(
            "SUPABASE_JWT_SECRET no está configurado en el backend"
        )

    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc
