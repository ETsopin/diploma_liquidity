"""
Роутер: /calculations — управление расчётным ядром.

POST /calculations           — запуск расчёта
GET  /calculations           — история расчётов
GET  /calculations/{id}      — детали расчёта
GET  /calculations/gap/{date}           — результаты ГЭП-анализа
GET  /calculations/concentration/{date} — результаты концентрации
"""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text

from liquidity.api.deps import Pagination, require_api_key
from liquidity.api.schemas import (
    CalculateRequest, CalculateResponse,
    CalculationRecord,
    ConcentrationItem, ConcentrationResponse,
    GapAnalysisResponse, GapBucketResult,
)
from liquidity.core.pipeline import CorePipeline
from liquidity.db import dwh_session
from liquidity.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/calculations", tags=["Calculations"])


@router.post(
    "",
    response_model=CalculateResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Запуск расчёта",
    dependencies=[Depends(require_api_key)],
)
async def run_calculation(body: CalculateRequest) -> CalculateResponse:
    """
    Запускает ГЭП-анализ и/или анализ концентрации за указанную дату.

    - **report_date**: дата отчёта (данные должны быть загружены через ETL)
    - **calc_type**: `gap` | `concentration` | `full`
    """
    pipeline = CorePipeline(
        report_date=body.report_date,
        calc_type=body.calc_type,
    )
    try:
        result = pipeline.run()
    except Exception as exc:
        log.error("api.calculate.failed", exc_info=exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Расчёт завершился с ошибкой: {exc}",
        )

    # Читаем id последнего успешного расчёта для этой даты
    with dwh_session() as session:
        row = session.execute(text("""
            SELECT id FROM dwh.gapcalculation
            WHERE report_date = :rd AND status = 'success'
            ORDER BY finished_at DESC NULLS LAST LIMIT 1
        """), {"rd": body.report_date}).fetchone()
    calc_id = row.id if row else 0

    return CalculateResponse(
        calculation_id=calc_id,
        status=result.status,
        report_date=result.report_date,
        calc_type=result.calc_type,
        gap_rows=result.gap_rows,
        conc_rows=result.conc_rows,
        duration_sec=result.duration_sec,
    )


@router.get(
    "",
    summary="История расчётов",
    dependencies=[Depends(require_api_key)],
)
async def list_calculations(
    report_date: date | None = Query(None, description="Фильтр по дате"),
    pg: Pagination = Depends(),
) -> dict:
    """Возвращает список расчётов из dwh.gapcalculation."""
    with dwh_session() as session:
        date_filter = "AND report_date = :rd" if report_date else ""
        params: dict = {"lim": pg.limit, "off": pg.offset}
        if report_date:
            params["rd"] = report_date

        rows = session.execute(text(f"""
            SELECT id, report_date, calc_type, status,
                   started_at, finished_at, error_message
            FROM dwh.gapcalculation
            WHERE 1=1 {date_filter}
            ORDER BY started_at DESC
            LIMIT :lim OFFSET :off
        """), params).fetchall()

        total = session.execute(text(f"""
            SELECT COUNT(*) FROM dwh.gapcalculation WHERE 1=1 {date_filter}
        """), params).scalar()

    return {
        "total": total,
        "limit": pg.limit,
        "offset": pg.offset,
        "items": [dict(r._mapping) for r in rows],
    }


@router.get(
    "/{calculation_id}",
    response_model=CalculationRecord,
    summary="Детали расчёта",
    dependencies=[Depends(require_api_key)],
)
async def get_calculation(calculation_id: int) -> CalculationRecord:
    with dwh_session() as session:
        row = session.execute(text("""
            SELECT id, report_date, calc_type, status,
                   started_at, finished_at, error_message
            FROM dwh.gapcalculation WHERE id = :cid
        """), {"cid": calculation_id}).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail=f"Расчёт {calculation_id} не найден.")
    return CalculationRecord(**dict(row._mapping))


# ---------------------------------------------------------------------------
# Результаты ГЭП-анализа
# ---------------------------------------------------------------------------

@router.get(
    "/gap/{report_date}",
    response_model=GapAnalysisResponse,
    summary="Результаты ГЭП-анализа",
    dependencies=[Depends(require_api_key)],
)
async def get_gap_results(
    report_date: date,
    calculation_id: int | None = Query(None, description="ID расчёта (по умолчанию — последний)"),
) -> GapAnalysisResponse:
    """
    Возвращает ГЭП-результаты за указанную дату из витрины mart.liquidity_gap_view.
    Если `calculation_id` не указан — берётся последний успешный расчёт.
    """
    with dwh_session() as session:
        # Определяем нужный calculation_id
        if calculation_id is None:
            row = session.execute(text("""
                SELECT id FROM dwh.gapcalculation
                WHERE report_date = :rd AND status = 'success'
                ORDER BY finished_at DESC NULLS LAST LIMIT 1
            """), {"rd": report_date}).fetchone()
            if row is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Нет данных ГЭП-анализа за {report_date}. Сначала запустите расчёт.",
                )
            calculation_id = row.id

        rows = session.execute(text("""
            SELECT bucket_code, bucket_name, sort_order,
                   total_assets_rub, total_liabilities_rub,
                   gap_rub, cumulative_gap_rub, gap_ratio_pct
            FROM mart.liquidity_gap_view
            WHERE report_date = :rd AND calculation_id = :cid
            ORDER BY sort_order
        """), {"rd": report_date, "cid": calculation_id}).fetchall()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"Нет данных ГЭП-анализа за {report_date} (расчёт #{calculation_id}).",
        )

    buckets = []
    total_a = total_l = 0.0
    for r in rows:
        a = float(r.total_assets_rub or 0)
        l = float(r.total_liabilities_rub or 0)
        total_a += a
        total_l += l
        buckets.append(GapBucketResult(
            bucket_code=r.bucket_code,
            bucket_name=r.bucket_name,
            sort_order=r.sort_order,
            total_assets_rub=a,
            total_liabilities_rub=l,
            gap_rub=float(r.gap_rub or 0),
            cumulative_gap_rub=float(r.cumulative_gap_rub or 0),
            gap_ratio_pct=float(r.gap_ratio_pct) if r.gap_ratio_pct is not None else None,
        ))

    return GapAnalysisResponse(
        report_date=report_date,
        calculation_id=calculation_id,
        buckets=buckets,
        total_assets=total_a,
        total_liabilities=total_l,
        net_gap=total_a - total_l,
    )


# ---------------------------------------------------------------------------
# Результаты концентрации
# ---------------------------------------------------------------------------

@router.get(
    "/concentration/{report_date}",
    response_model=ConcentrationResponse,
    summary="Результаты концентрации",
    dependencies=[Depends(require_api_key)],
)
async def get_concentration(
    report_date: date,
    category: str = Query("liability", description="asset | liability"),
    calculation_id: int | None = Query(None),
) -> ConcentrationResponse:
    """
    Возвращает данные концентрации портфеля по контрагентам за указанную дату.
    """
    if category not in ("asset", "liability"):
        raise HTTPException(status_code=400, detail="category должен быть 'asset' или 'liability'.")

    with dwh_session() as session:
        if calculation_id is None:
            row = session.execute(text("""
                SELECT id FROM dwh.gapcalculation
                WHERE report_date = :rd AND status = 'success'
                ORDER BY finished_at DESC NULLS LAST LIMIT 1
            """), {"rd": report_date}).fetchone()
            if row is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Нет данных за {report_date}.",
                )
            calculation_id = row.id

        rows = session.execute(text("""
            SELECT
                cp.code           AS counterparty_code,
                cp.short_name     AS counterparty_name,
                cp.counterparty_type,
                tb.code           AS bucket_code,
                tb.name           AS bucket_name,
                cr.amount_rub,
                cr.share_pct
            FROM dwh.concentrationresult cr
            JOIN dwh.counterpartyref cp ON cp.id = cr.counterparty_id
            JOIN dwh.timebucket tb      ON tb.id = cr.timebucket_id
            WHERE cr.report_date   = :rd
              AND cr.calculation_id = :cid
              AND cr.category       = :cat
            ORDER BY cr.share_pct DESC
        """), {"rd": report_date, "cid": calculation_id, "cat": category}).fetchall()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"Нет данных концентрации за {report_date} (категория: {category}).",
        )

    items = [
        ConcentrationItem(
            counterparty_code=r.counterparty_code,
            counterparty_name=r.counterparty_name,
            counterparty_type=r.counterparty_type or "",
            bucket_code=r.bucket_code,
            bucket_name=r.bucket_name,
            amount_rub=float(r.amount_rub),
            share_pct=float(r.share_pct),
        )
        for r in rows
    ]
    total = sum(i.amount_rub for i in items)

    return ConcentrationResponse(
        report_date=report_date,
        calculation_id=calculation_id,
        category=category,
        items=items,
        total_amount=total,
    )
