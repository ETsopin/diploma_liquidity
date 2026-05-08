"""
Расчётное ядро — ГЭП-анализ (разрывы ликвидности).

Алгоритм:
  1. Читаем dwh.asset и dwh.liability за report_date (только is_valid=true)
  2. Группируем по timebucket_id, суммируем amount_rub
  3. По каждой временной корзине: gap = assets - liabilities
  4. Считаем cumulative_gap нарастающим итогом
  5. Считаем gap_ratio = gap / liabilities (если liabilities > 0)
  6. Пишем результаты в dwh.gapresult
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal

import pandas as pd
from sqlalchemy import text

from liquidity.db import dwh_session
from liquidity.logger import get_logger

log = get_logger(__name__)


class GapCalculator:
    """
    Рассчитывает разрывы ликвидности (ГЭП) по временным корзинам.
    """

    def __init__(self, report_date: date, calculation_id: int) -> None:
        self.report_date = report_date
        self.calculation_id = calculation_id

    # ------------------------------------------------------------------
    # Шаг 1: загрузка данных из DWH
    # ------------------------------------------------------------------

    def _load_assets(self) -> pd.DataFrame:
        """Загружает валидные активы за дату отчёта."""
        with dwh_session() as session:
            rows = session.execute(text("""
                SELECT
                    a.timebucket_id,
                    tb.code        AS bucket_code,
                    tb.name        AS bucket_name,
                    tb.sort_order,
                    COALESCE(SUM(a.amount_rub), 0) AS total_assets
                FROM dwh.asset a
                JOIN dwh.timebucket tb ON tb.id = a.timebucket_id
                WHERE a.report_date = :rd
                  AND a.is_valid = TRUE
                GROUP BY a.timebucket_id, tb.code, tb.name, tb.sort_order
            """), {"rd": self.report_date}).fetchall()
        df = pd.DataFrame(rows, columns=["timebucket_id", "bucket_code",
                                          "bucket_name", "sort_order", "total_assets"])
        log.info("gap_calculator.assets_loaded",
                 report_date=str(self.report_date), rows=len(df))
        return df

    def _load_liabilities(self) -> pd.DataFrame:
        """Загружает валидные обязательства за дату отчёта."""
        with dwh_session() as session:
            rows = session.execute(text("""
                SELECT
                    l.timebucket_id,
                    COALESCE(SUM(l.amount_rub), 0) AS total_liabilities
                FROM dwh.liability l
                WHERE l.report_date = :rd
                  AND l.is_valid = TRUE
                GROUP BY l.timebucket_id
            """), {"rd": self.report_date}).fetchall()
        df = pd.DataFrame(rows, columns=["timebucket_id", "total_liabilities"])
        log.info("gap_calculator.liabilities_loaded",
                 report_date=str(self.report_date), rows=len(df))
        return df

    def _load_all_buckets(self) -> pd.DataFrame:
        """Загружает все временные корзины — чтобы в результате были все строки,
        даже если в какой-то корзине нет ни активов, ни обязательств."""
        with dwh_session() as session:
            rows = session.execute(text("""
                SELECT id AS timebucket_id, code AS bucket_code,
                       name AS bucket_name, sort_order
                FROM dwh.timebucket
                ORDER BY sort_order
            """)).fetchall()
        return pd.DataFrame(rows, columns=["timebucket_id", "bucket_code",
                                            "bucket_name", "sort_order"])

    # ------------------------------------------------------------------
    # Шаг 2: расчёт
    # ------------------------------------------------------------------

    def calculate(self) -> pd.DataFrame:
        """
        Возвращает DataFrame с результатами ГЭП-анализа по всем корзинам.
        Колонки: timebucket_id, bucket_code, bucket_name, sort_order,
                 total_assets, total_liabilities, gap, cumulative_gap, gap_ratio
        """
        buckets  = self._load_all_buckets()
        assets   = self._load_assets()
        liabs    = self._load_liabilities()

        # Объединяем: все корзины + данные по активам + данные по обязательствам
        df = buckets.merge(assets[["timebucket_id", "total_assets"]],
                           on="timebucket_id", how="left")
        df = df.merge(liabs, on="timebucket_id", how="left")

        df["total_assets"]      = df["total_assets"].fillna(0).astype(float)
        df["total_liabilities"] = df["total_liabilities"].fillna(0).astype(float)

        df = df.sort_values("sort_order").reset_index(drop=True)

        # Разрыв ликвидности
        df["gap"] = df["total_assets"] - df["total_liabilities"]

        # Накопленный разрыв (нарастающий итог слева направо)
        df["cumulative_gap"] = df["gap"].cumsum()

        # Отношение разрыва к обязательствам (в процентах)
        df["gap_ratio"] = df.apply(
            lambda r: round(r["gap"] / r["total_liabilities"] * 100, 4)
            if r["total_liabilities"] != 0 else None,
            axis=1,
        )

        log.info(
            "gap_calculator.calculated",
            report_date=str(self.report_date),
            total_assets=round(df["total_assets"].sum(), 2),
            total_liabilities=round(df["total_liabilities"].sum(), 2),
            net_gap=round(df["gap"].sum(), 2),
        )
        return df

    # ------------------------------------------------------------------
    # Шаг 3: сохранение результатов
    # ------------------------------------------------------------------

    def save(self, df: pd.DataFrame) -> int:
        """Записывает результаты в dwh.gapresult. Возвращает количество строк."""
        rows = df.to_dict("records")
        inserted = 0

        with dwh_session() as session:
            conn = session.get_bind().raw_connection()
            cur = conn.cursor()
            try:
                # Удаляем предыдущие результаты для этого расчёта (idempotency)
                cur.execute(
                    "DELETE FROM dwh.gapresult WHERE calculation_id = %s",
                    (self.calculation_id,)
                )
                for r in rows:
                    cur.execute("""
                        INSERT INTO dwh.gapresult (
                            calculation_id, report_date, timebucket_id,
                            total_assets, total_liabilities,
                            cumulative_gap, gap_ratio
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        self.calculation_id,
                        self.report_date,
                        int(r["timebucket_id"]),
                        round(float(r["total_assets"]), 2),
                        round(float(r["total_liabilities"]), 2),
                        round(float(r["cumulative_gap"]), 2) if r["cumulative_gap"] is not None else None,
                        round(float(r["gap_ratio"]), 4) if r["gap_ratio"] is not None else None,
                    ))
                    inserted += 1
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                cur.close()
                conn.close()

        log.info("gap_calculator.saved", rows=inserted, calculation_id=self.calculation_id)
        return inserted

    def run(self) -> pd.DataFrame:
        """Полный цикл: расчёт + сохранение."""
        df = self.calculate()
        self.save(df)
        return df
