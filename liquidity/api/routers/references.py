"""
Роутер: /references — справочные данные (временные корзины, контрагенты).

GET /references/timebuckets    — список временных корзин
GET /references/counterparties — список контрагентов
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text

from liquidity.api.deps import Pagination, require_api_key
from liquidity.api.schemas import CounterpartyInfo, TimebucketInfo
from liquidity.db import dwh_session

router = APIRouter(prefix="/references", tags=["References"])


@router.get(
    "/timebuckets",
    response_model=list[TimebucketInfo],
    summary="Временные корзины (ЦБ РФ)",
    dependencies=[Depends(require_api_key)],
)
async def list_timebuckets() -> list[TimebucketInfo]:
    """Возвращает все 8 временных корзин согласно нормативам ЦБ РФ."""
    with dwh_session() as session:
        rows = session.execute(text("""
            SELECT id, code, name, min_days, max_days, sort_order
            FROM dwh.timebucket ORDER BY sort_order
        """)).fetchall()
    return [TimebucketInfo(**dict(r._mapping)) for r in rows]


@router.get(
    "/counterparties",
    summary="Контрагенты",
    dependencies=[Depends(require_api_key)],
)
async def list_counterparties(
    search: str | None = Query(None, description="Поиск по коду или названию"),
    pg: Pagination = Depends(),
) -> dict:
    """Возвращает список контрагентов из DWH."""
    with dwh_session() as session:
        search_filter = ""
        params: dict = {"lim": pg.limit, "off": pg.offset}
        if search:
            search_filter = """
                AND (LOWER(code) LIKE :q
                  OR LOWER(short_name) LIKE :q
                  OR LOWER(full_name) LIKE :q
                  OR inn LIKE :q)
            """
            params["q"] = f"%{search.lower()}%"

        rows = session.execute(text(f"""
            SELECT id, code, short_name, full_name,
                   inn, counterparty_type, country
            FROM dwh.counterpartyref
            WHERE 1=1 {search_filter}
            ORDER BY code
            LIMIT :lim OFFSET :off
        """), params).fetchall()

        total = session.execute(text(f"""
            SELECT COUNT(*) FROM dwh.counterpartyref WHERE 1=1 {search_filter}
        """), params).scalar()

    return {
        "total": total,
        "limit": pg.limit,
        "offset": pg.offset,
        "items": [dict(r._mapping) for r in rows],
    }
