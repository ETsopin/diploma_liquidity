"""
Настройка structlog — структурированное JSON-логирование.
Используем PrintLoggerFactory (без интеграции со stdlib).
"""
import logging
import structlog
from liquidity.config import app_settings


def setup_logging() -> None:
    log_level = getattr(logging, app_settings.log_level.upper(), logging.INFO)

    structlog.configure(
        processors=[
            # add_logger_name несовместим с PrintLoggerFactory — используем
            # собственный процессор, который берёт имя из bound-переменных
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.ExceptionRenderer(),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = __name__):
    return structlog.get_logger().bind(logger=name)
