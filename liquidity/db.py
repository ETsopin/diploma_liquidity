"""
Фабрики SQLAlchemy-движков и сессий для DWH и Source АБС.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

from liquidity.config import dwh_settings, source_settings


# ---------------------------------------------------------------------------
# DWH engine
# ---------------------------------------------------------------------------
_dwh_engine = None
_DwhSession = None


def get_dwh_engine():
    global _dwh_engine
    if _dwh_engine is None:
        _dwh_engine = create_engine(
            dwh_settings.url,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            connect_args={"options": "-c statement_timeout=60000"},
        )
    return _dwh_engine


def get_dwh_session_factory():
    global _DwhSession
    if _DwhSession is None:
        _DwhSession = sessionmaker(bind=get_dwh_engine(), autoflush=False, autocommit=False)
    return _DwhSession


@contextmanager
def dwh_session() -> Generator[Session, None, None]:
    """Контекстный менеджер: сессия к DWH с авто-коммитом/роллбэком."""
    factory = get_dwh_session_factory()
    session: Session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Source (АБС) engine — только для чтения
# ---------------------------------------------------------------------------
_source_engine = None
_SourceSession = None


def get_source_engine():
    global _source_engine
    if _source_engine is None:
        _source_engine = create_engine(
            source_settings.url,
            pool_size=3,
            max_overflow=5,
            pool_pre_ping=True,
            connect_args={"options": "-c default_transaction_read_only=on"},
        )
    return _source_engine


def get_source_session_factory():
    global _SourceSession
    if _SourceSession is None:
        _SourceSession = sessionmaker(bind=get_source_engine(), autoflush=False, autocommit=False)
    return _SourceSession


@contextmanager
def source_session() -> Generator[Session, None, None]:
    """Контекстный менеджер: сессия к АБС (read-only)."""
    factory = get_source_session_factory()
    session: Session = factory()
    try:
        yield session
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Healthcheck
# ---------------------------------------------------------------------------
def check_connections() -> dict[str, bool]:
    """Проверяет доступность обеих БД. Возвращает {name: ok}."""
    result = {}
    for name, engine in [("dwh", get_dwh_engine()), ("source_abs", get_source_engine())]:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            result[name] = True
        except Exception:
            result[name] = False
    return result
