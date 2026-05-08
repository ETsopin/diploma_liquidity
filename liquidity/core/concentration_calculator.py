"""
Расчётное ядро — анализ концентрации ликвидности.

Считает долю каждого контрагента в общем портфеле активов и обязательств.
Это позволяет выявить концентрационный риск: если один контрагент занимает
слишком большую долю пассивов, его досрочный отзыв средств создаёт угрозу.

Алгоритм:
  1. Читаем dwh.asset / dwh.liability за report_date (только is_valid=true)
  2. Группируем по counterparty_id, суммируем amount_rub
  3. Считаем долю каждого контрагента в общем портфеле (share_pct)
  4. Опционально разбиваем по timebucket_id
  5. Записываем в dwh.concentrationresult
"""
from __future__ import annotations

from datetime import date
from typing import Literal

import pandas as pd
from sqlalchemy import text

from liquidity.db import dwh_session
from liquidity.logger import get_logger

log = get_logger(__name__)

Category = Literal["asset", "liability"]


class ConcentrationCalculator:
    """
    Рассчитывает концентрацию портфеля по контрагентам.
    """

    def __init__(self, report_date: date, calculation_id: int) -> None:
        self.report_date    = report_date
        self.calculation_id = calculation_id

    # ------------------------------------------------------------------
    # Шаг 1: загрузка
    # ------------------------------------------------------------------

    def _load(self, category: Category) -> pd.DataFrame:
        table = "dwh.asset" if category == "asset" else "dwh.liability"
        with dwh_session() as session:
            rows = session.execute(text(f"""
                SELECT
                    t.counterparty_id,
                    cr.code       AS counterparty_code,
                    cr.short_name AS counterparty_name,
                    cr.counterparty_type,
                    t.timebucket_id,
                    tb.code       AS bucket_code,
                    SUM(t.amount_rub) AS amount_rub
                FROM {table} t
                JOIN dwh.counterpartyref cr ON cr.id = t.counterparty_id
                JOIN dwh.timebucket tb      ON tb.id = t.timebucket_id
                WHERE t.report_date = :rd
                  AND t.is_valid    = TRUE
                  AND t.counterparty_id IS NOT NULL
                GROUP BY
                    t.counterparty_id, cr.code, cr.short_name,
                    cr.counterparty_type, t.timebucket_id, tb.code
                ORDER BY amount_rub DESC
            """), {"rd": self.report_date}).fetchall()

        df = pd.DataFrame(rows, columns=[
            "counterparty_id", "counterparty_code", "counterparty_name",
            "counterparty_type", "timebucket_id", "bucket_code", "amount_rub"
        ])
        df["amount_rub"] = df["amount_rub"].astype(float)
        log.info("concentration_calculator.loaded",
                 category=category, rows=len(df),
                 report_date=str(self.report_date))
        return df

    # ------------------------------------------------------------------
    # Шаг 2: расчёт долей
    # ------------------------------------------------------------------

    def _calc_shares(self, df: pd.DataFrame) -> pd.DataFrame:
        """Добавляет колонку share_pct — доля контрагента в общем портфеле."""
        total = df["amount_rub"].sum()
        df = df.copy()
        df["share_pct"] = (
            df["amount_rub"] / total * 100
            if total > 0
            else 0.0
        )
        df["share_pct"] = df["share_pct"].round(3)
        return df

    def calculate(self) -> dict[str, pd.DataFrame]:
        """
        Возвращает словарь {'asset': DataFrame, 'liability': DataFrame}
        с результатами по каждой категории.
        """
        result = {}
        for category in ("asset", "liability"):
            df = self._load(category)
            if df.empty:
                log.warning("concentration_calculator.no_data",
                            category=category, report_date=str(self.report_date))
                result[category] = df
                continue

            df = self._calc_shares(df)

            # Топ-концентрации для лога
            top = df.groupby("counterparty_code")["amount_rub"].sum()
            top_total = top.sum()
            top_shares = (top / top_total * 100).round(1).sort_values(ascending=False)
            log.info(
                "concentration_calculator.top_counterparties",
                category=category,
                top3={k: f"{v}%" for k, v in top_shares.head(3).items()},
            )
            result[category] = df

        return result

    # ------------------------------------------------------------------
    # Шаг 3: сохранение
    # ------------------------------------------------------------------

    def save(self, results: dict[str, pd.DataFrame]) -> int:
        inserted = 0
        with dwh_session() as session:
            conn = session.get_bind().raw_connection()
            cur = conn.cursor()
            try:
                # Идемпотентность
                cur.execute(
                    "DELETE FROM dwh.concentrationresult WHERE calculation_id = %s",
                    (self.calculation_id,)
                )
                for category, df in results.items():
                    if df.empty:
                        continue
                    for _, r in df.iterrows():
                        cur.execute("""
                            INSERT INTO dwh.concentrationresult (
                                calculation_id, report_date, counterparty_id,
                                category, amount_rub, share_pct, timebucket_id
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (
                            self.calculation_id,
                            self.report_date,
                            int(r["counterparty_id"]),
                            category,
                            round(float(r["amount_rub"]), 2),
                            round(float(r["share_pct"]), 3),
                            int(r["timebucket_id"]) if r["timebucket_id"] else None,
                        ))
                        inserted += 1
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                cur.close()
                conn.close()

        log.info("concentration_calculator.saved",
                 rows=inserted, calculation_id=self.calculation_id)
        return inserted

    def run(self) -> dict[str, pd.DataFrame]:
        """Полный цикл: расчёт + сохранение."""
        results = self.calculate()
        self.save(results)
        return results
