"""
Расчётное ядро — Pipeline (оркестратор).

Запускает ГЭП-анализ и расчёт концентрации, ведёт журнал в dwh.gapcalculation,
обновляет витрину mart.liquidity_gap_view.

CLI:
    uv run calculate --date 2025-12-01
    uv run calculate --date 2025-12-01 --type gap
    uv run calculate --date 2025-12-01 --type concentration
"""
from __future__ import annotations

import sys
import traceback
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Literal

import click
from sqlalchemy import text

from liquidity.db import dwh_session
from liquidity.logger import get_logger, setup_logging
from liquidity.core.gap_calculator import GapCalculator
from liquidity.core.concentration_calculator import ConcentrationCalculator

log = get_logger(__name__)

CalcType = Literal["gap", "concentration", "full"]


@dataclass
class CalcResult:
    calc_type:   CalcType
    report_date: date
    started_at:  datetime = field(default_factory=datetime.now)
    finished_at: datetime | None = None
    status:      str = "running"
    error:       str | None = None
    gap_rows:    int = 0
    conc_rows:   int = 0

    @property
    def duration_sec(self) -> float | None:
        if self.finished_at:
            return (self.finished_at - self.started_at).total_seconds()
        return None

    def summary(self) -> str:
        return (
            f"CALCULATE [{self.calc_type}] {self.report_date} | "
            f"status={self.status} | "
            f"gap_rows={self.gap_rows} | conc_rows={self.conc_rows} | "
            f"duration={self.duration_sec:.1f}s"
        )


class CorePipeline:
    """
    Оркестрирует запуск расчётного ядра.
    """

    def __init__(
        self,
        report_date: date,
        calc_type: CalcType = "full",
        initiated_by: int | None = None,
    ) -> None:
        self.report_date  = report_date
        self.calc_type    = calc_type
        self.initiated_by = initiated_by

    def run(self) -> CalcResult:
        result = CalcResult(calc_type=self.calc_type, report_date=self.report_date)
        calculation_id = self._create_calculation_record()
        log.info("core_pipeline.start",
                 calc_type=self.calc_type,
                 report_date=str(self.report_date),
                 calculation_id=calculation_id)
        try:
            if self.calc_type in ("gap", "full"):
                gap_calc = GapCalculator(self.report_date, calculation_id)
                gap_df   = gap_calc.run()
                result.gap_rows = len(gap_df)

            if self.calc_type in ("concentration", "full"):
                conc_calc  = ConcentrationCalculator(self.report_date, calculation_id)
                conc_data  = conc_calc.run()
                result.conc_rows = sum(len(df) for df in conc_data.values())

            if self.calc_type == "full":
                self._refresh_mart(calculation_id)

            result.status = "success"
            self._update_calculation_record(calculation_id, "success")

        except Exception as exc:
            result.status = "failed"
            result.error  = traceback.format_exc()
            self._update_calculation_record(calculation_id, "failed", str(exc))
            log.error("core_pipeline.failed", exc_info=exc)
            raise
        finally:
            result.finished_at = datetime.now()
            log.info("core_pipeline.done", summary=result.summary())

        return result

    # ------------------------------------------------------------------
    # Журнал расчётов
    # ------------------------------------------------------------------

    def _create_calculation_record(self) -> int:
        with dwh_session() as session:
            row = session.execute(text("""
                INSERT INTO dwh.gapcalculation
                    (report_date, calc_type, status, started_at, initiated_by)
                VALUES (:rd, :ct, 'running', NOW(), :uid)
                RETURNING id
            """), {
                "rd":  self.report_date,
                "ct":  self.calc_type,
                "uid": self.initiated_by,
            }).fetchone()
        log.info("core_pipeline.calculation_created", calculation_id=row.id)
        return row.id

    def _update_calculation_record(
        self, calculation_id: int, status: str, error: str | None = None
    ) -> None:
        with dwh_session() as session:
            session.execute(text("""
                UPDATE dwh.gapcalculation
                SET status       = :status,
                    finished_at  = NOW(),
                    error_message = :error
                WHERE id = :cid
            """), {"status": status, "error": error, "cid": calculation_id})

    # ------------------------------------------------------------------
    # Обновление витрины mart.liquidity_gap_view
    # ------------------------------------------------------------------

    def _refresh_mart(self, calculation_id: int) -> None:
        """
        Пересчитывает витрину mart.liquidity_gap_view для данного расчёта.
        Денормализует gapresult + timebucket в плоскую таблицу для API/фронта.
        """
        log.info("core_pipeline.refresh_mart", calculation_id=calculation_id)
        with dwh_session() as session:
            # Удаляем старые данные этого расчёта
            session.execute(text("""
                DELETE FROM mart.liquidity_gap_view
                WHERE calculation_id = :cid
            """), {"cid": calculation_id})

            # Заполняем из gapresult + timebucket
            session.execute(text("""
                INSERT INTO mart.liquidity_gap_view (
                    report_date, calculation_id,
                    bucket_code, bucket_name, sort_order,
                    total_assets_rub, total_liabilities_rub,
                    gap_rub, cumulative_gap_rub, gap_ratio_pct,
                    refreshed_at
                )
                SELECT
                    gr.report_date,
                    gr.calculation_id,
                    tb.code,
                    tb.name,
                    tb.sort_order,
                    gr.total_assets,
                    gr.total_liabilities,
                    gr.gap,
                    gr.cumulative_gap,
                    gr.gap_ratio,
                    NOW()
                FROM dwh.gapresult gr
                JOIN dwh.timebucket tb ON tb.id = gr.timebucket_id
                WHERE gr.calculation_id = :cid
                ORDER BY tb.sort_order
            """), {"cid": calculation_id})

        log.info("core_pipeline.mart_refreshed", calculation_id=calculation_id)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

@click.command(name="calculate")
@click.option(
    "--date", "report_date_str",
    required=True,
    metavar="YYYY-MM-DD",
    help="Дата отчёта для расчёта.",
)
@click.option(
    "--type", "calc_type",
    type=click.Choice(["gap", "concentration", "full"]),
    default="full",
    show_default=True,
    help="Тип расчёта.",
)
@click.option(
    "--user-id", "user_id",
    default=None,
    type=int,
    help="ID пользователя, запустившего расчёт.",
)
def cli(report_date_str: str, calc_type: str, user_id: int | None) -> None:
    """Запуск расчётного ядра: ГЭП-анализ и концентрация."""
    setup_logging()

    try:
        report_date = date.fromisoformat(report_date_str)
    except ValueError:
        click.echo(f"Ошибка: неверный формат даты '{report_date_str}'. Используй YYYY-MM-DD.")
        sys.exit(1)

    click.echo(f"Запуск расчёта: type={calc_type}, date={report_date}")
    pipeline = CorePipeline(
        report_date=report_date,
        calc_type=calc_type,
        initiated_by=user_id,
    )

    try:
        result = pipeline.run()
        click.echo(result.summary())
        sys.exit(0 if result.status == "success" else 1)
    except Exception:
        click.echo("\n--- TRACEBACK ---", err=True)
        click.echo(traceback.format_exc(), err=True)
        sys.exit(1)


if __name__ == "__main__":
    cli()
