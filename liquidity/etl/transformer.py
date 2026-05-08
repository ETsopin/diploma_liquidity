"""
ETL — Transformer.

Принимает сырые DataFrame из Extractor-ов и:
  1. Очищает данные (убирает пустые строки, некорректные суммы, валюты)
  2. Нормализует типы колонок
  3. Обогащает справочниками: counterparty_code -> id, product_type -> id
  4. Рассчитывает days_to_maturity и определяет timebucket_id
  5. Пересчитывает суммы в рубли по курсу на дату отчёта
  6. Возвращает DataFrame, готовый к загрузке в staging / DWH
"""
from __future__ import annotations

import math
from datetime import date, datetime
from typing import Literal

import numpy as np
import pandas as pd
from sqlalchemy import text

from liquidity.db import dwh_session
from liquidity.logger import get_logger

log = get_logger(__name__)

Category = Literal["asset", "liability"]

# Коды продуктов, для которых maturity_date = NULL означает «до востребования»
_ON_DEMAND_PRODUCT_TYPES = {
    "DEPOSIT_DEMAND",
    "CASH",
}


class ReferenceCache:
    """
    Кэш справочных данных из DWH (counterpartyref, producttyperef, timebucket).
    Загружается один раз за сессию ETL.
    """

    def __init__(self) -> None:
        self._counterparties:     dict[str, int] = {}  # любой ключ (код/имя/ИНН) -> id
        self._counterparty_codes: dict[str, str] = {}  # любой ключ -> канонический код
        self._product_types:      dict[str, int] = {}  # code -> id
        self._timebuckets:        list[dict]      = []  # sorted by sort_order

    def load(self) -> None:
        log.info("reference_cache.loading")
        with dwh_session() as session:
            rows = session.execute(
                text("SELECT id, code, full_name, short_name, inn FROM dwh.counterpartyref")
            ).fetchall()
            self._counterparties = {}
            self._counterparty_codes = {}
            for r in rows:
                # Приоритет поиска: ИНН > код > полное имя > краткое имя
                for key in filter(None, [r.inn, r.code, r.full_name, r.short_name]):
                    self._counterparties[key] = r.id
                    self._counterparty_codes[key] = r.code

            rows = session.execute(
                text("SELECT id, code FROM dwh.producttyperef")
            ).fetchall()
            self._product_types = {r.code: r.id for r in rows}

            rows = session.execute(
                text(
                    "SELECT id, code, min_days, max_days, sort_order "
                    "FROM dwh.timebucket ORDER BY sort_order"
                )
            ).fetchall()
            self._timebuckets = [
                {
                    "id": r.id,
                    "code": r.code,
                    "min_days": r.min_days,
                    "max_days": r.max_days,
                }
                for r in rows
            ]
        unique_counterparties = len({v for v in self._counterparties.values()})
        log.info(
            "reference_cache.loaded",
            counterparties=unique_counterparties,
            product_types=len(self._product_types),
            timebuckets=len(self._timebuckets),
        )

    def counterparty_id(self, key: str) -> int | None:
        """Возвращает id по коду, полному или краткому имени."""
        return self._counterparties.get(key)

    def resolve_counterparty_code(self, key: str) -> str | None:
        """Возвращает канонический код ('GAZP') по любому варианту написания."""
        return self._counterparty_codes.get(key)

    def product_type_id(self, code: str) -> int | None:
        return self._product_types.get(code)

    def timebucket_id(self, days: int | None, product_type: str | None) -> int | None:
        """Определяет timebucket по количеству дней до погашения."""
        if days is None or product_type in _ON_DEMAND_PRODUCT_TYPES:
            # до востребования — первый бакет
            for tb in self._timebuckets:
                if tb["code"] == "ON_DEMAND":
                    return tb["id"]
            return None

        for tb in self._timebuckets:
            min_d = tb["min_days"]
            max_d = tb["max_days"]  # None = без ограничений
            if days >= min_d and (max_d is None or days <= max_d):
                return tb["id"]
        return None


class Transformer:
    """
    Трансформирует сырые DataFrame в нормализованный вид для DWH.

    Usage:
        cache = ReferenceCache()
        cache.load()
        transformer = Transformer(cache, report_date=date.today())
        staging_assets = transformer.transform_assets(raw_df, source="postgres")
        dwh_assets     = transformer.to_dwh_assets(staging_assets)
    """

    def __init__(self, cache: ReferenceCache, report_date: date) -> None:
        self.cache = cache
        self.report_date = report_date
        # Курсы валют: {currency_code: rate_to_rub} — заполняется через set_exchange_rates
        self._fx_rates: dict[str, float] = {"RUB": 1.0}

    def set_exchange_rates(self, fx_df: pd.DataFrame) -> None:
        """
        Загружает актуальные курсы на дату отчёта из DataFrame.
        fx_df должен содержать колонки: currency_code, rate_date, rate_to_rub
        """
        if fx_df.empty:
            log.warning("transformer.no_fx_rates")
            return

        fx_df = fx_df.copy()
        fx_df["rate_date"] = pd.to_datetime(fx_df["rate_date"]).dt.date
        # Берём курс на ближайшую дату <= report_date
        filtered = fx_df[fx_df["rate_date"] <= self.report_date]
        if filtered.empty:
            log.warning("transformer.fx_no_matching_date", report_date=str(self.report_date))
            return
        latest = (
            filtered.sort_values("rate_date", ascending=False)
            .drop_duplicates(subset=["currency_code"])
        )
        self._fx_rates = {"RUB": 1.0}
        for _, row in latest.iterrows():
            self._fx_rates[row["currency_code"]] = float(row["rate_to_rub"])
        log.info("transformer.fx_rates_loaded", rates=self._fx_rates)

    def _rate(self, currency: str) -> float:
        return self._fx_rates.get(currency.upper(), 1.0)

    # ------------------------------------------------------------------
    # Шаг 1: очистка и нормализация сырого DataFrame (→ staging-формат)
    # ------------------------------------------------------------------

    def _clean(self, df: pd.DataFrame) -> pd.DataFrame:
        """Базовая очистка: убираем строки без суммы или номера договора."""
        initial = len(df)
        df = df.copy()

        # Нормализуем строковые колонки
        for col in ("contract_number", "counterparty_code", "counterparty_name",
                    "product_type", "currency", "status"):
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip()
                df[col] = df[col].replace({"nan": None, "None": None, "": None})

        # Нормализуем даты: NaT → None
        for col in ("issue_date", "maturity_date"):
            if col in df.columns:
                df[col] = (
                    pd.to_datetime(df[col], errors="coerce")
                    .apply(lambda x: x.date() if not pd.isnull(x) else None)
                )

        # Нормализуем числа
        df["amount"] = pd.to_numeric(df.get("amount"), errors="coerce")
        df["currency"] = df["currency"].str.upper() if "currency" in df.columns else "RUB"

        # Отбрасываем строки без обязательных полей
        mask_ok = df["amount"].notna() & (df["amount"] > 0)
        if "contract_number" in df.columns:
            mask_ok &= df["contract_number"].notna()

        dropped = (~mask_ok).sum()
        if dropped:
            log.warning("transformer.rows_dropped", count=int(dropped), reason="missing/invalid fields")
        df = df[mask_ok].copy()
        log.debug("transformer.clean.done", before=initial, after=len(df))
        return df

    def _days_to_maturity(self, maturity_date) -> int | None:
        """Вычисляет дни от report_date до maturity_date."""
        if maturity_date is None:
            return None
        try:
            if pd.isnull(maturity_date):
                return None
        except (TypeError, ValueError):
            pass
        if isinstance(maturity_date, float) and math.isnan(maturity_date):
            return None
        if isinstance(maturity_date, str):
            try:
                maturity_date = date.fromisoformat(maturity_date)
            except ValueError:
                return None
        if isinstance(maturity_date, datetime):
            maturity_date = maturity_date.date()
        delta = (maturity_date - self.report_date).days
        return max(delta, 0)  # уже истёкшие договоры — 0 дней

    def transform_for_staging(
        self, df: pd.DataFrame, category: Category, source_system: str
    ) -> pd.DataFrame:
        """
        Готовит DataFrame для записи в staging.stagingasset / stagingliability.
        Возвращает DataFrame с фиксированным набором колонок.
        """
        df = self._clean(df)
        if df.empty:
            return df

        staging_rows = []
        for _, row in df.iterrows():
            # Резолвим контрагента до канонического кода.
            # Приоритет: ИНН (самый надёжный) > код из АБС > полное имя > краткое имя.
            inn  = row.get("counterparty_inn")
            code = row.get("counterparty_code")
            name = row.get("counterparty_name") or row.get("counterparty_short_name")

            canonical_code = (
                self.cache.resolve_counterparty_code(inn)  if inn  else None
                or self.cache.resolve_counterparty_code(code) if code else None
                or self.cache.resolve_counterparty_code(name) if name else None
            )
            # Если не нашли — сохраняем лучший из доступных ключей (будет is_valid=false)
            counterparty_code = canonical_code or code or name

            staging_rows.append({
                "raw_contract_id":    row.get("contract_number"),
                "counterparty_code":  counterparty_code,
                "product_code":       row.get("product_type"),
                "amount":             row.get("amount"),
                "currency":           row.get("currency", "RUB"),
                "maturity_date":      row.get("maturity_date"),
                "issue_date":         row.get("issue_date"),
                "asset_type" if category == "asset" else "liability_type": row.get("product_type"),
                "source_system":      source_system,
                "raw_data": {
                    k: str(v) for k, v in row.items()
                    if v is not None and not (isinstance(v, float) and math.isnan(v))
                },
            })

        result = pd.DataFrame(staging_rows)
        result["is_processed"] = False
        log.info(
            "transformer.staging_ready",
            category=category,
            rows=len(result),
        )
        return result

    # ------------------------------------------------------------------
    # Шаг 2: нормализация staging → DWH (обогащение справочниками)
    # ------------------------------------------------------------------

    def transform_to_dwh(
        self, staging_df: pd.DataFrame, category: Category
    ) -> pd.DataFrame:
        """
        Принимает staging DataFrame, возвращает DataFrame для dwh.asset / dwh.liability.
        """
        if staging_df.empty:
            return staging_df

        dwh_rows = []
        validation_errors = 0

        for _, row in staging_df.iterrows():
            product_code = row.get("product_code")
            counterparty_code = row.get("counterparty_code")
            currency = str(row.get("currency", "RUB")).upper()
            amount = float(row.get("amount", 0))
            maturity_date = row.get("maturity_date")
            issue_date = row.get("issue_date")

            # Lookup справочников
            counterparty_id = self.cache.counterparty_id(counterparty_code) if counterparty_code else None
            product_type_id = self.cache.product_type_id(product_code) if product_code else None

            # Дни до погашения и временная корзина
            days = self._days_to_maturity(maturity_date)
            timebucket_id = self.cache.timebucket_id(days, product_code)

            # Пересчёт в рубли
            rate = self._rate(currency)
            amount_rub = round(amount * rate, 2)

            # Валидация
            is_valid = True
            notes: list[str] = []
            if counterparty_id is None:
                notes.append(f"counterparty not found: {counterparty_code}")
                is_valid = False
                validation_errors += 1
            if product_type_id is None:
                notes.append(f"product_type not found: {product_code}")
                is_valid = False
            if timebucket_id is None:
                notes.append("timebucket not determined")
            if maturity_date is None:
                notes.append("maturity date not determined")
            if issue_date is None:
                notes.append("issue date not determined")

            dwh_rows.append({
                "staging_id":       row.get("id"),         # заполняется после записи в staging
                "counterparty_id":  counterparty_id,
                "product_type_id":  product_type_id,
                "contract_number":  row.get("raw_contract_id"),
                "amount":           amount,
                "amount_rub":       amount_rub,
                "currency":         currency,
                "exchange_rate":    rate,
                "issue_date":       issue_date,
                "maturity_date":    maturity_date,
                "timebucket_id":    timebucket_id,
                "days_to_maturity": days,
                "report_date":      self.report_date,
                "is_valid":         is_valid,
                "validation_notes": "; ".join(notes) if notes else None,
            })

        result = pd.DataFrame(dwh_rows)
        if validation_errors:
            log.warning(
                "transformer.validation_errors",
                category=category,
                errors=validation_errors,
                total=len(result),
            )
        log.info("transformer.dwh_ready", category=category, rows=len(result))
        return result
