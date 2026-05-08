"""
Роутер: /health — проверка работоспособности системы.
"""
from fastapi import APIRouter
from liquidity.db import check_connections

router = APIRouter(tags=["System"])


@router.get("/health", summary="Healthcheck")
async def health_check():
    """Проверяет подключение к базам данных и возвращает статус системы."""
    db_ok = check_connections()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "error",
    }
