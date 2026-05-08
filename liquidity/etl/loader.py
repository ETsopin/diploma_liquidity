"""
ETL — Loader.

Записывает трансформированные данные в БД:
  1. staging.stagingasset / staging.stagingliability
  2. dwh.asset / dwh.liability (после трансформации)

Использует batch-вставку через psycopg2 execute_values для производительности.
"""
from __future__ import annotations

import json
import math
from datetime import date
from typing import Any, Literal

import pandas as pd
from sqlalchemy import text

from liquidity.db import dwh_session
from liquidity.logger import get_logger

log = get_logger(__name__)

Category = Literal["asset", "liability"]

# Размер пачки при bulk-insert
_BATCH_SIZE = 500


def _clean(value: Any) -> Any:
    """Конвертирует pandas NaT / float NaN / numpy scalar в None или Python-тип."""
    if value is pd.NaT:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    # numpy int/float → python int/float
    if hasattr(value, "item"):
        return value.item()
    return value


class Loader:
    """Загрузчик данных в staging и DWH."""

    # ------------------------------------------------------------------
    # Staging layer
    # ------------------------------------------------------------------

    def load_staging_assets(
        self, df: pd.DataFrame, batch_id: int
    ) -> list[int]:
        """
        Записывает DataFrame в staging.stagingasset.
        Возвращает список staging_id вставленных строк.
        """
        return self._load_staging(df, batch_id, "asset")

    def load_staging_liabilities(
        self, df: pd.DataFrame, batch_id: int
    ) -> list[int]:
        return self._load_staging(df, batch_id, "liability")

    def _load_staging(
        self, df: pd.DataFrame, batch_id: int, category: Category
    ) -> list[int]:
        if df.empty:
            return []

        table = (
            "staging.stagingasset"
            if category == "asset"
            else "staging.stagingliability"
        )
        type_col = "asset_type" if category == "asset" else "liability_type"

        inserted_ids: list[int] = []
        rows = df.to_dict("records")

        with dwh_session() as session:
            conn = session.get_bind().raw_connection()
            cur = conn.cursor()
            try:
                for i in range(0, len(rows), _BATCH_SIZE):
                    batch = rows[i : i + _BATCH_SIZE]
                    values = []
                    for r in batch:
                        raw_data = r.get("raw_data") or {}
                        values.append((
                            batch_id,
                            _clean(r.get("raw_contract_id")),
                            _clean(r.get("counterparty_code")),
                            _clean(r.get("product_code")),
                            _clean(r.get("amount")),
                            _clean(r.get("currency")) or "RUB",
                            _clean(r.get("maturity_date")),
                            _clean(r.get("issue_date")),
                            _clean(r.get(type_col) or r.get("product_code")),
                            json.dumps(raw_data, default=str),
                            False,
                            _clean(r.get("source_system")) or "",
                        ))

                    cur.executemany(
                        f"""
                        INSERT INTO {table} (
                            batch_id, raw_contract_id, counterparty_code, product_code,
                            amount, currency, maturity_date, issue_date, {type_col},
                            raw_data, is_processed, source_system
                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s)
                        RETURNING id
                        """,
                        values,
                    )
                    # psycopg2 executemany с RETURNING возвращает только последний
                    # Используем fetchall после каждой строки через execute в цикле
                    # Переделаем на execute_values для получения всех id

                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                cur.close()
                conn.close()

        # Получаем id вставленных строк по batch_id
        with dwh_session() as session:
            rows_db = session.execute(
                text(f"SELECT id FROM {table} WHERE batch_id = :bid ORDER BY id"),
                {"bid": batch_id},
            ).fetchall()
            inserted_ids = [r.id for r in rows_db]

        log.info(
            "loader.staging.done",
            table=table,
            batch_id=batch_id,
            rows=len(inserted_ids),
        )
        return inserted_ids

    # ------------------------------------------------------------------
    # DWH layer
    # ------------------------------------------------------------------

    def load_dwh_assets(
        self, df: pd.DataFrame, batch_id: int, staging_ids: list[int]
    ) -> int:
        """Записывает нормализованные активы в dwh.asset."""
        return self._load_dwh(df, batch_id, staging_ids, "asset")

    def load_dwh_liabilities(
        self, df: pd.DataFrame, batch_id: int, staging_ids: list[int]
    ) -> int:
        return self._load_dwh(df, batch_id, staging_ids, "liability")

    def _load_dwh(
        self,
        df: pd.DataFrame,
        batch_id: int,
        staging_ids: list[int],
        category: Category,
    ) -> int:
        if df.empty:
            return 0

        table = "dwh.asset" if category == "asset" else "dwh.liability"

        # Присваиваем staging_id каждой строке (по порядку)
        df = df.copy()
        if staging_ids:
            df["staging_id"] = (staging_ids + [None] * len(df))[: len(df)]
        else:
            df["staging_id"] = None

        rows = df.to_dict("records")
        inserted = 0

        with dwh_session() as session:
            conn = session.get_bind().raw_connection()
            cur = conn.cursor()
            try:
                for i in range(0, len(rows), _BATCH_SIZE):
                    batch = rows[i : i + _BATCH_SIZE]
                    values = []
                    for r in batch:
                        values.append((
                            _clean(r.get("staging_id")),
                            batch_id,
                            _clean(r.get("counterparty_id")),
                            _clean(r.get("product_type_id")),
                            _clean(r.get("contract_number")),
                            _clean(r.get("amount")),
                            _clean(r.get("amount_rub")),
                            _clean(r.get("currency")) or "RUB",
                            _clean(r.get("exchange_rate")) or 1.0,
                            _clean(r.get("issue_date")),
                            _clean(r.get("maturity_date")),
                            _clean(r.get("timebucket_id")),
                            _clean(r.get("days_to_maturity")),
                            _clean(r.get("report_date")),
                            r.get("is_valid", True),
                            _clean(r.get("validation_notes")),
                        ))

                    cur.executemany(
                        f"""
                        INSERT INTO {table} (
                            staging_id, batch_id, counterparty_id, product_type_id,
                            contract_number, amount, amount_rub, currency, exchange_rate,
                            issue_date, maturity_date, timebucket_id, days_to_maturity,
                            report_date, is_valid, validation_notes
                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        """,
                        values,
                    )
                    inserted += len(batch)

                # Помечаем строки staging как обработанные
                if staging_ids:
                    staging_table = (
                        "staging.stagingasset"
                        if category == "asset"
                        else "staging.stagingliability"
                    )
                    cur.execute(
                        f"UPDATE {staging_table} SET is_processed = TRUE "
                        f"WHERE batch_id = %s",
                        (batch_id,),
                    )

                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                cur.close()
                conn.close()

        log.info("loader.dwh.done", table=table, batch_id=batch_id, rows=inserted)
        return inserted

    # ------------------------------------------------------------------
    # Синхронизация справочников из источника
    # ------------------------------------------------------------------

    def sync_counterparties(self, df: pd.DataFrame) -> int:
        """
        UPSERT контрагентов из АБС в dwh.counterpartyref.
        Новые — вставляются, существующие — обновляются по полю code.
        Возвращает количество обработанных строк.
        """
        if df.empty:
            return 0

        rows = df.to_dict("records")
        upserted = 0

        with dwh_session() as session:
            conn = session.get_bind().raw_connection()
            cur = conn.cursor()
            try:
                for r in rows:
                    cur.execute(
                        """
                        INSERT INTO dwh.counterpartyref
                            (code, full_name, short_name, inn, counterparty_type, country, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW())
                        ON CONFLICT (code) DO UPDATE SET
                            full_name        = EXCLUDED.full_name,
                            short_name       = EXCLUDED.short_name,
                            inn              = EXCLUDED.inn,
                            counterparty_type = EXCLUDED.counterparty_type,
                            country          = EXCLUDED.country,
                            updated_at       = NOW()
                        """,
                        (
                            _clean(r.get("code")),
                            _clean(r.get("full_name")),
                            _clean(r.get("short_name")),
                            _clean(r.get("inn")),
                            _clean(r.get("counterparty_type")),
                            _clean(r.get("country")) or "RU",
                        ),
                    )
                    upserted += 1
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                cur.close()
                conn.close()

        log.info("loader.sync_counterparties.done", upserted=upserted)
        return upserted

    # ------------------------------------------------------------------
    # Управление batch
    # ------------------------------------------------------------------

    def create_batch(self, datasource_id: int, initiated_by: int | None = None) -> int:
        """Создаёт запись в audit.rawdatabatch со статусом 'running', возвращает id."""
        with dwh_session() as session:
            row = session.execute(
                text(
                    """
                    INSERT INTO audit.rawdatabatch (datasource_id, status, initiated_by)
                    VALUES (:ds_id, 'running', :user_id)
                    RETURNING id
                    """
                ),
                {"ds_id": datasource_id, "user_id": initiated_by},
            ).fetchone()
            batch_id = row.id
        log.info("loader.batch_created", batch_id=batch_id, datasource_id=datasource_id)
        return batch_id

    def finish_batch(
        self,
        batch_id: int,
        status: str,
        rows_extracted: int = 0,
        rows_loaded: int = 0,
        error: str | None = None,
    ) -> None:
        """Обновляет запись batch: ставит финальный статус и временны́е метки."""
        with dwh_session() as session:
            session.execute(
                text(
                    """
                    UPDATE audit.rawdatabatch
                    SET status         = :status,
                        finished_at    = NOW(),
                        rows_extracted = :extracted,
                        rows_loaded    = :loaded,
                        error_message  = :error
                    WHERE id = :bid
                    """
                ),
                {
                    "status":    status,
                    "extracted": rows_extracted,
                    "loaded":    rows_loaded,
                    "error":     error,
                    "bid":       batch_id,
                },
            )
        log.info("loader.batch_finished", batch_id=batch_id, status=status)

    def get_datasource_id(self, name: str) -> int | None:
        """Получает id источника данных по имени."""
        with dwh_session() as session:
            row = session.execute(
                text("SELECT id FROM audit.datasource WHERE name = :name"),
                {"name": name},
            ).fetchone()
        return row.id if row else None
