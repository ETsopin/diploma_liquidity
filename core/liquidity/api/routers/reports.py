"""
Роутер: /reports — генерация и скачивание отчётов.

POST /reports/generate          — поставить задачу генерации
GET  /reports                   — список задач генерации
GET  /reports/{task_id}/download — скачать сформированный файл
"""
from __future__ import annotations

import mimetypes
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from liquidity.api.deps import Pagination, require_api_key
from liquidity.api.schemas import (
    ReportGenerateRequest, ReportTaskRecord, StatusResponse
)
from liquidity.db import dwh_session
from liquidity.reports.generator import ReportGenerator
from liquidity.logger import get_logger
from sqlalchemy import text

log = get_logger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])

_FORMAT_MIME = {
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pdf":  "application/pdf",
    "csv":  "text/csv",
}


@router.post(
    "/generate",
    response_model=StatusResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Сгенерировать отчёт",
    dependencies=[Depends(require_api_key)],
)
async def generate_report(body: ReportGenerateRequest) -> StatusResponse:
    """
    Генерирует отчёт в указанном формате.
    Результат сохраняется в файловой системе, ссылка хранится в dwh.reporttask.
    """
    generator = ReportGenerator(
        report_date=body.report_date,
        report_type=body.report_type,
        report_format=body.report_format,
    )
    try:
        paths = generator.run()
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        log.error("api.reports.generate.failed", exc_info=exc)
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка генерации отчёта: {exc}",
        )

    return StatusResponse(
        status="success",
        message=f"Отчёт сформирован: {', '.join(p.name for p in paths)}",
    )


@router.get(
    "",
    summary="Список задач отчётов",
    dependencies=[Depends(require_api_key)],
)
async def list_reports(pg: Pagination = Depends()) -> dict:
    """Возвращает историю задач генерации отчётов."""
    with dwh_session() as session:
        rows = session.execute(text("""
            SELECT id, report_date, report_type, report_format,
                   report_name, status, file_path, error_message,
                   created_at, finished_at
            FROM dwh.reporttask
            ORDER BY created_at DESC
            LIMIT :lim OFFSET :off
        """), {"lim": pg.limit, "off": pg.offset}).fetchall()

        total = session.execute(
            text("SELECT COUNT(*) FROM dwh.reporttask")
        ).scalar()

    return {
        "total": total,
        "limit": pg.limit,
        "offset": pg.offset,
        "items": [dict(r._mapping) for r in rows],
    }


@router.get(
    "/{task_id}",
    response_model=ReportTaskRecord,
    summary="Детали задачи отчёта",
    dependencies=[Depends(require_api_key)],
)
async def get_report_task(task_id: int) -> ReportTaskRecord:
    with dwh_session() as session:
        row = session.execute(text("""
            SELECT id, report_date, report_type, report_format,
                   report_name, status, file_path, error_message,
                   created_at, finished_at
            FROM dwh.reporttask WHERE id = :tid
        """), {"tid": task_id}).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail=f"Задача {task_id} не найдена.")
    return ReportTaskRecord(**dict(row._mapping))


@router.get(
    "/{task_id}/download",
    summary="Скачать отчёт",
    dependencies=[Depends(require_api_key)],
)
async def download_report(task_id: int):
    """
    Возвращает файл отчёта. Требует, чтобы задача была в статусе `success`.
    """
    with dwh_session() as session:
        row = session.execute(text("""
            SELECT status, file_path, report_format, report_name
            FROM dwh.reporttask WHERE id = :tid
        """), {"tid": task_id}).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail=f"Задача {task_id} не найдена.")

    if row.status != "success":
        raise HTTPException(
            status_code=400,
            detail=f"Отчёт не готов (статус: {row.status}).",
        )

    # Берём первый путь (CSV может содержать несколько через "; ")
    file_path_str = (row.file_path or "").split("; ")[0].strip()
    file_path = Path(file_path_str)

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Файл отчёта не найден на диске: {file_path}",
        )

    fmt = row.report_format or "xlsx"
    media_type = _FORMAT_MIME.get(fmt, "application/octet-stream")
    filename = row.report_name or file_path.name

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=filename,
    )
