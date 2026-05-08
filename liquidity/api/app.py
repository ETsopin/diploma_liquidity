"""
FastAPI-приложение — точка входа.

Запуск:
    uvicorn liquidity.api.app:app --host 0.0.0.0 --port 8000 --reload

Или через uv:
    uv run python -m uvicorn liquidity.api.app:app --reload
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from liquidity.api.routers import calculations, etl, health, references, reports
from liquidity.config import app_settings
from liquidity.db import check_connections
from liquidity.logger import get_logger, setup_logging

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Инициализация при старте приложения."""
    setup_logging()
    log.info("api.startup", host=app_settings.api_host, port=app_settings.api_port)
    ok = check_connections()
    if not ok:
        log.warning("api.startup.db_check_failed")
    yield
    log.info("api.shutdown")


app = FastAPI(
    title="Система отчётности по структурной ликвидности",
    description=(
        "REST API для автоматизированного формирования отчётности по структурной ликвидности банка.\n\n"
        "**Аутентификация**: все защищённые эндпоинты требуют заголовок `X-API-Key`.\n\n"
        "**Типичный рабочий процесс:**\n"
        "1. `POST /etl/run` — загрузить данные из источников\n"
        "2. `POST /calculations` — запустить ГЭП-анализ и концентрацию\n"
        "3. `GET /calculations/gap/{date}` — получить результаты\n"
        "4. `POST /reports/generate` — сформировать отчёт\n"
        "5. `GET /reports/{id}/download` — скачать файл\n"
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — разрешаем фронтенду обращаться к API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # в продакшне — конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Роутеры
# ---------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(etl.router)
app.include_router(calculations.router)
app.include_router(reports.router)
app.include_router(references.router)


# ---------------------------------------------------------------------------
# Глобальный обработчик исключений
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error("api.unhandled_exception", path=str(request.url), exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Внутренняя ошибка сервера: {type(exc).__name__}"},
    )


# ---------------------------------------------------------------------------
# Корневой маршрут
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "Liquidity Reporting API",
        "version": "1.0.0",
        "docs": "/docs",
    }
