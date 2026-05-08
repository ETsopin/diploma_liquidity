"""
Зависимости FastAPI (Depends).

• Аутентификация через заголовок X-API-Key
• Пагинация
"""
from __future__ import annotations

from fastapi import Header, HTTPException, Query, status

from liquidity.config import app_settings


# ---------------------------------------------------------------------------
# Аутентификация
# ---------------------------------------------------------------------------

async def require_api_key(x_api_key: str = Header(..., alias="X-API-Key")) -> str:
    """
    Проверяет заголовок X-API-Key.
    Значение берётся из конфига (SECRET_KEY в .env).
    """
    if x_api_key != app_settings.secret_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный API-ключ.",
        )
    return x_api_key


# ---------------------------------------------------------------------------
# Пагинация
# ---------------------------------------------------------------------------

class Pagination:
    def __init__(
        self,
        limit:  int = Query(50,  ge=1, le=500,  description="Кол-во записей"),
        offset: int = Query(0,   ge=0,           description="Смещение"),
    ):
        self.limit  = limit
        self.offset = offset
