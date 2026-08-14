"""Verificación de JWT de Supabase Auth.

Los tokens de sesión pueden venir firmados de dos formas, según cómo esté
configurado el proyecto de Supabase:
  - **HS256** con un secreto compartido (`SUPABASE_JWT_SECRET`): esquema
    legacy, y el que usa el stub de auth local para tests end-to-end sin un
    servidor de Supabase real (ver `backend/scripts/local_auth_stub.sql`).
  - **ES256/RS256** con un par de claves asimétricas: default en proyectos
    nuevos de Supabase. Se verifica contra la clave pública publicada en
    `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`.

El `alg` del header del propio token (no una config nuestra) decide qué
camino tomar — nunca hay que confiar en que el cliente lo declare "bien" sin
verificar la firma después, pero el algoritmo en sí no es secreto. El `aud`
estándar para usuarios logueados es `"authenticated"`.
"""

from __future__ import annotations

from functools import lru_cache

import jwt

from app.core.config import get_settings


class InvalidTokenError(Exception):
    pass


@lru_cache
def _jwks_client() -> jwt.PyJWKClient:
    """Cliente cacheado: pyjwt guarda las claves en memoria y solo vuelve a
    pedir el JWKS si aparece un `kid` que no tiene, así que esto no golpea
    la red en cada request."""
    settings = get_settings()
    if not settings.supabase_url:
        raise RuntimeError("SUPABASE_URL no está configurado en el backend")
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    return jwt.PyJWKClient(url)


def decode_access_token(token: str) -> dict:
    settings = get_settings()

    try:
        alg = jwt.get_unverified_header(token).get("alg")
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc

    try:
        if alg == "HS256":
            if not settings.supabase_jwt_secret:
                # Falta de configuración, no del cliente: no tiene sentido devolver 401.
                raise RuntimeError(
                    "SUPABASE_JWT_SECRET no está configurado en el backend"
                )
            key = settings.supabase_jwt_secret
        else:
            key = _jwks_client().get_signing_key_from_jwt(token).key

        return jwt.decode(token, key, algorithms=[alg], audience="authenticated")
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc
