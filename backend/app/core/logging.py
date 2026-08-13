"""Logging estructurado en JSON, sin dependencias nuevas.

Un log por línea en JSON es lo que espera cualquier agregador (CloudWatch,
Datadog, Loki, etc.) sin configuración extra. `request_id_var` permite
correlacionar todas las líneas de un mismo request: `app.core.middleware` lo
completa al principio de cada request y las líneas de negocio (logger.info en
los servicios) lo heredan automáticamente sin tener que pasarlo a mano.
"""

from __future__ import annotations

import json
import logging
import sys
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")

# Atributos propios de LogRecord: todo lo que no esté acá vino de `extra={}`
# y se vuelca tal cual al JSON (ver RequestContextMiddleware).
_RESERVED_ATTRS = set(vars(logging.LogRecord("", 0, "", 0, "", (), None))) | {
    "message",
    "asctime",
}


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_var.get(),
        }
        for key, value in record.__dict__.items():
            if key not in _RESERVED_ATTRS and key not in payload:
                payload[key] = value
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str, ensure_ascii=False)


def configure_logging(level: int = logging.INFO) -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)

    # Los loggers de uvicorn traen su propio formatter por default; se
    # redirigen al mismo handler para que todo salga con la misma forma.
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uv_logger = logging.getLogger(name)
        uv_logger.handlers = [handler]
        uv_logger.propagate = False
