"""
ETL — Pipeline (оркестратор).

Объединяет Extract → Transform → Load в единый процесс.
Запускается через CLI:

    uv run etl [--source postgres|excel|all] [--date 2025-12-01]

Архитектура запуска:
    1. Инициализация: загрузка справочников, создание batch-записи
    2. Для каждого источника:
       a. Extract  — получить сырые DataFrame
       b. Transform — очистить, нормализовать, обогатить справочниками
       c. Load     — записать в staging, затем в DWH
    3. Финализация: обновить статус batch, залогировать итоги
"""
from __future__ import annotations

import sys
import traceback
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Literal

import click

from liquidity.logger import get_logger, setup_logging
from liquidity.etl.extractor import PostgresExtractor, ExcelExtractor
from liquidity.etl.transformer import Transformer, ReferenceCache
from liquidity.etl.loader import Loader

log = get_logger(__name__)

Source = Literal["postgres", "excel", "all"]


@dataclass
class ETLResult:
    """Итоги одного запуска пайплайна."""
    source: str
    report_date: date
    started_at: datetime = field(default_factory=datetime.now)
    finished_at: datetime | None = None
    assets_extracted: int = 0
    liabilities_extracted: int = 0
    assets_loaded: int = 0
    liabilities_loaded: int = 0
    status: str = "running"
    error: str | None = None
    batch_id: int = 0  # ID последнего созданного batch (для API)

    @property
    def duration_sec(self) -> float | None:
        if self.finished_at:
            return (self.finished_at - self.started_at).total_seconds()
        return None

    def summary(self) -> str:
        return (
            f"ETL [{self.source}] {self.report_date} | "
            f"status={self.status} | "
            f"assets: {self.assets_extracted} extracted, {self.assets_loaded} loaded | "
            f"liabilities: {self.liabilities_extracted} extracted, {self.liabilities_loaded} loaded | "
            f"duration: {self.duration_sec:.1f}s"
        )


class ETLPipeline:
    """
    Полный ETL-пайплайн для одного источника данных.
    """

    def __init__(
        self,
        source: Source = "all",
        report_date: date | None = None,
        initiated_by: int | None = None,
    ) -> None:
        self.source = source
        self.report_date = report_date or date.today()
        self.initiated_by = initiated_by

        self.loader = Loader()
        self.cache = ReferenceCache()

    def run(self) -> ETLResult:
        """Запускает пайплайн и возвращает результат."""
        result = ETLResult(source=self.source, report_date=self.report_date)
        log.info("etl_pipeline.start", source=self.source, report_date=str(self.report_date))

        try:
            # 1. Загружаем справочники
            self.cache.load()

            # 2. Запускаем нужные источники
            if self.source in ("postgres", "all"):
                self._run_postgres(result)

            if self.source in ("excel", "all"):
                self._run_excel(result)

            result.status = "success"

        except Exception as exc:
            result.status = "failed"
            result.error = traceback.format_exc()
            log.error("etl_pipeline.failed", error=str(exc), exc_info=exc)
            raise
        finally:
            result.finished_at = datetime.now()
            log.info("etl_pipeline.done", summary=result.summary())

        return result

    # ------------------------------------------------------------------
    # Источник 1: PostgreSQL АБС
    # ------------------------------------------------------------------

    def _run_postgres(self, result: ETLResult) -> None:
        log.info("etl_pipeline.postgres.start")
        ds_id = self.loader.get_datasource_id("bank_abs_postgresql") or 1
        batch_id = self.loader.create_batch(ds_id, self.initiated_by)
        result.batch_id = batch_id

        try:
            extractor = PostgresExtractor()
            transformer = Transformer(self.cache, self.report_date)

            # --- ШАГ 0: Синхронизация справочника контрагентов из АБС → DWH ---
            # counterpartyref ведётся в АБС — синхронизируем перед загрузкой фактов
            counterparties_df = extractor.extract_counterparties()
            synced = self.loader.sync_counterparties(counterparties_df)
            log.info("etl_pipeline.counterparties_synced", count=synced)
            # Перезагружаем кэш справочников — он мог устареть
            self.cache.load()

            # Курсы валют
            fx_df = extractor.extract_exchange_rates()
            transformer.set_exchange_rates(fx_df)

            # --- АКТИВЫ ---
            raw_assets = extractor.extract_assets()
            result.assets_extracted += len(raw_assets)

            staging_assets = transformer.transform_for_staging(
                raw_assets, "asset", "bank_abs_postgresql"
            )
            staging_ids_a = self.loader.load_staging_assets(staging_assets, batch_id)

            dwh_assets = transformer.transform_to_dwh(staging_assets, "asset")
            loaded_a = self.loader.load_dwh_assets(dwh_assets, batch_id, staging_ids_a)
            result.assets_loaded += loaded_a

            # --- ОБЯЗАТЕЛЬСТВА ---
            raw_liabs = extractor.extract_liabilities()
            result.liabilities_extracted += len(raw_liabs)

            staging_liabs = transformer.transform_for_staging(
                raw_liabs, "liability", "bank_abs_postgresql"
            )
            staging_ids_l = self.loader.load_staging_liabilities(staging_liabs, batch_id)

            dwh_liabs = transformer.transform_to_dwh(staging_liabs, "liability")
            loaded_l = self.loader.load_dwh_liabilities(dwh_liabs, batch_id, staging_ids_l)
            result.liabilities_loaded += loaded_l

            self.loader.finish_batch(
                batch_id,
                status="success",
                rows_extracted=result.assets_extracted + result.liabilities_extracted,
                rows_loaded=result.assets_loaded + result.liabilities_loaded,
            )
            log.info("etl_pipeline.postgres.done")

        except Exception as exc:
            tb = traceback.format_exc()
            log.error("etl_pipeline.source.failed", exc_info=exc)
            self.loader.finish_batch(
                batch_id, status="failed", error=tb
            )
            raise

    # ------------------------------------------------------------------
    # Источник 2: Excel-файлы
    # ------------------------------------------------------------------

    def _run_excel(self, result: ETLResult) -> None:
        log.info("etl_pipeline.excel.start")
        ds_id = self.loader.get_datasource_id("excel_assets") or 2
        batch_id = self.loader.create_batch(ds_id, self.initiated_by)
        result.batch_id = batch_id

        try:
            extractor = ExcelExtractor()
            transformer = Transformer(self.cache, self.report_date)

            # Курсы из Excel
            fx_df = extractor.extract_exchange_rates()
            transformer.set_exchange_rates(fx_df)

            # --- АКТИВЫ ---
            raw_assets = extractor.extract_assets()
            result.assets_extracted += len(raw_assets)

            staging_assets = transformer.transform_for_staging(
                raw_assets, "asset", "excel"
            )
            staging_ids_a = self.loader.load_staging_assets(staging_assets, batch_id)

            dwh_assets = transformer.transform_to_dwh(staging_assets, "asset")
            loaded_a = self.loader.load_dwh_assets(dwh_assets, batch_id, staging_ids_a)
            result.assets_loaded += loaded_a

            # --- ОБЯЗАТЕЛЬСТВА ---
            raw_liabs = extractor.extract_liabilities()
            result.liabilities_extracted += len(raw_liabs)

            staging_liabs = transformer.transform_for_staging(
                raw_liabs, "liability", "excel"
            )
            staging_ids_l = self.loader.load_staging_liabilities(staging_liabs, batch_id)

            dwh_liabs = transformer.transform_to_dwh(staging_liabs, "liability")
            loaded_l = self.loader.load_dwh_liabilities(dwh_liabs, batch_id, staging_ids_l)
            result.liabilities_loaded += loaded_l

            self.loader.finish_batch(
                batch_id,
                status="success",
                rows_extracted=result.assets_extracted + result.liabilities_extracted,
                rows_loaded=result.assets_loaded + result.liabilities_loaded,
            )
            log.info("etl_pipeline.excel.done")

        except Exception as exc:
            tb = traceback.format_exc()
            log.error("etl_pipeline.source.failed", exc_info=exc)
            self.loader.finish_batch(
                batch_id, status="failed", error=tb
            )
            raise


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

@click.command(name="etl")
@click.option(
    "--source",
    type=click.Choice(["postgres", "excel", "all"]),
    default="all",
    show_default=True,
    help="Источник данных для загрузки.",
)
@click.option(
    "--date",
    "report_date_str",
    default=None,
    metavar="YYYY-MM-DD",
    help="Дата отчёта (по умолчанию — сегодня).",
)
@click.option(
    "--user-id",
    "user_id",
    default=None,
    type=int,
    help="ID пользователя, запустившего ETL.",
)
def cli(source: str, report_date_str: str | None, user_id: int | None) -> None:
    """Запуск ETL-пайплайна: извлечение, трансформация и загрузка данных в DWH."""
    setup_logging()

    report_date: date | None = None
    if report_date_str:
        try:
            report_date = date.fromisoformat(report_date_str)
        except ValueError:
            click.echo(f"Ошибка: неверный формат даты '{report_date_str}'. Используй YYYY-MM-DD.")
            sys.exit(1)

    click.echo(f"Запуск ETL: source={source}, date={report_date or 'today'}")
    pipeline = ETLPipeline(source=source, report_date=report_date, initiated_by=user_id)

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
