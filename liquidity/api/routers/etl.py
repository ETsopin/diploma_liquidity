"""
Роутер: /etl — управление ETL-процессом.

POST /etl/run  — запуск загрузки данных
GET  /etl/batches — история загрузок
GET  /etl/batches/{batch_id} — детали конкретной загрузки
"""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text

from liquidity.api.deps import Pagination, require_api_key
from liquidity.api.schemas import ETLRunRequest, ETLRunResponse, StatusResponse
from liquidity.db import dwh_session
from liquidity.etl.pipeline import ETLPipeline
from liquidity.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/etl", tags=["ETL"])


@router.post(
    "/run",
    response_model=ETLRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Запуск ETL",
    dependencies=[Depends(require_api_key)],
)
async def run_etl(body: ETLRunRequest) -> ETLRunResponse:
    """
    Запускает ETL-процесс для указанного источника и даты.

    - **source**: `postgres` | `excel` | `all`
    - **report_date**: дата отчёта (по умолчанию — сегодня)

    Операция синхронная (в рамках диплома). В продакшне следует выносить в Celery/задачи.
    """
    report_date = body.report_date or date.today()
    pipeline = ETLPipeline(report_date=report_date, source=body.source)

    try:
        result = pipeline.run()
    except Exception as exc:
        log.error("api.etl.run.failed", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ETL завершился с ошибкой: {exc}",
        )

    return ETLRunResponse(
        batch_id=result.batch_id,
        status=result.status,
        source=body.source,
        report_date=report_date,
        assets_loaded=result.assets_loaded,
        liabs_loaded=result.liabs_loaded,
        started_at=result.started_at,
        finished_at=result.finished_at,
        error=result.error,
    )


@router.get(
    "/batches",
    summary="История ETL-загрузок",
    dependencies=[Depends(require_api_key)],
)
async def list_batches(pg: Pagination = Depends()) -> dict:
    """Возвращает список пакетов загрузки из audit.rawdatabatch."""
    with dwh_session() as session:
        rows = session.execute(text("""
            SELECT id, datasource_id, report_date, status,
                   started_at, finished_at, error_message,
                   total_records, loaded_records
            FROM audit.rawdatabatch
            ORDER BY started_at DESC
            LIMIT :lim OFFSET :off
        """), {"lim": pg.limit, "off": pg.offset}).fetchall()

        total = session.execute(
            text("SELECT COUNT(*) FROM audit.rawdatabatch")
        ).scalar()

    return {
        "total": total,
        "limit": pg.limit,
        "offset": pg.offset,
        "items": [dict(r._mapping) for r in rows],
    }


@router.get(
    "/batches/{batch_id}",
    summary="Детали ETL-загрузки",
    dependencies=[Depends(require_api_key)],
)
async def get_batch(batch_id: int) -> dict:
    """Возвращает детали конкретного пакета загрузки."""
    with dwh_session() as session:
        row = session.execute(text("""
            SELECT b.*, d.name AS datasource_name
            FROM audit.rawdatabatch b
            JOIN audit.datasource d ON d.id = b.datasource_id
            WHERE b.id = :bid
        """), {"bid": batch_id}).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} не найден.")
    return dict(row._mapping)
