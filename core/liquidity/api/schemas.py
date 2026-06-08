"""
Pydantic-схемы для запросов и ответов API.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Общие
# ---------------------------------------------------------------------------

class StatusResponse(BaseModel):
    status: str
    message: str | None = None


class ErrorResponse(BaseModel):
    detail: str


# ---------------------------------------------------------------------------
# ETL
# ---------------------------------------------------------------------------

class ETLRunRequest(BaseModel):
    source: Literal["postgres", "excel", "all"] = Field(
        "all", description="Источник данных для запуска ETL."
    )
    report_date: date | None = Field(
        None,
        description="Дата отчёта (по умолчанию сегодня).",
    )


class ETLRunResponse(BaseModel):
    batch_id:     int
    status:       str
    source:       str
    report_date:  date
    assets_loaded: int = 0
    liabs_loaded:  int = 0
    started_at:   datetime
    finished_at:  datetime | None = None
    error:        str | None = None


# ---------------------------------------------------------------------------
# Расчёты
# ---------------------------------------------------------------------------

class CalculateRequest(BaseModel):
    report_date: date = Field(..., description="Дата отчёта в формате YYYY-MM-DD.")
    calc_type: Literal["gap", "concentration", "full"] = Field(
        "full", description="Тип расчёта."
    )


class CalculationRecord(BaseModel):
    id:           int
    report_date:  date
    calc_type:    str
    status:       str
    started_at:   datetime
    finished_at:  datetime | None
    error_message: str | None

    class Config:
        from_attributes = True


class CalculateResponse(BaseModel):
    calculation_id: int
    status:         str
    report_date:    date
    calc_type:      str
    gap_rows:       int = 0
    conc_rows:      int = 0
    duration_sec:   float | None = None


# ---------------------------------------------------------------------------
# ГЭП-анализ
# ---------------------------------------------------------------------------

class GapBucketResult(BaseModel):
    bucket_code:           str
    bucket_name:           str
    sort_order:            int
    total_assets_rub:      float
    total_liabilities_rub: float
    gap_rub:               float
    cumulative_gap_rub:    float
    gap_ratio_pct:         float | None

    class Config:
        from_attributes = True


class GapAnalysisResponse(BaseModel):
    report_date:    date
    calculation_id: int
    buckets:        list[GapBucketResult]
    total_assets:   float
    total_liabilities: float
    net_gap:        float


# ---------------------------------------------------------------------------
# Концентрация
# ---------------------------------------------------------------------------

class ConcentrationItem(BaseModel):
    counterparty_code: str
    counterparty_name: str
    counterparty_type: str
    bucket_code:       str
    bucket_name:       str
    amount_rub:        float
    share_pct:         float

    class Config:
        from_attributes = True


class ConcentrationResponse(BaseModel):
    report_date:    date
    calculation_id: int
    category:       str
    items:          list[ConcentrationItem]
    total_amount:   float


# ---------------------------------------------------------------------------
# Отчёты
# ---------------------------------------------------------------------------

class ReportGenerateRequest(BaseModel):
    report_date:   date = Field(..., description="Дата отчёта.")
    report_type:   Literal["gap", "concentration", "full"] = "full"
    report_format: Literal["excel", "pdf", "csv"] = "excel"


class ReportTaskRecord(BaseModel):
    id:            int
    report_date:   date
    report_type:   str
    report_format: str
    report_name:   str | None
    status:        str
    file_path:     str | None
    error_message: str | None
    created_at:    datetime
    finished_at:   datetime | None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Справочники
# ---------------------------------------------------------------------------

class TimebucketInfo(BaseModel):
    id:         int
    code:       str
    name:       str
    min_days:   int
    max_days:   int | None
    sort_order: int


class CounterpartyInfo(BaseModel):
    id:               int
    code:             str
    short_name:       str
    full_name:        str | None
    inn:              str | None
    counterparty_type: str | None
    country:          str | None
