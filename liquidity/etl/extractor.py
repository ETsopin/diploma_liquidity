"""
ETL — Extractor.

Извлекает сырые данные из двух источников:
  1. PostgresExtractor  — читает contracts_assets / contracts_liabilities из АБС
  2. ExcelExtractor     — читает Excel-файлы из data/excel_sources/
"""
from __future__ import annotations

from pathlib import Path
from typing import Literal

import pandas as pd
from sqlalchemy import text

from liquidity.db import source_session
from liquidity.config import app_settings
from liquidity.logger import get_logger

log = get_logger(__name__)

# Тип категории для удобства
Category = Literal["asset", "liability"]

# ---------------------------------------------------------------------------
# SQL-запросы к АБС
# ---------------------------------------------------------------------------

_QUERY_ASSETS = text("""
    SELECT
        ca.contract_number,
        c.code               AS counterparty_code,
        c.full_name          AS counterparty_name,
        ca.product_type,
        ca.amount,
        ca.currency,
        ca.interest_rate,
        ca.issue_date,
        ca.maturity_date,
        ca.status,
        ca.account_number
    FROM contracts_assets ca
    JOIN counterparties c ON c.id = ca.counterparty_id
    WHERE ca.status = 'active'
    ORDER BY ca.id
""")

_QUERY_LIABILITIES = text("""
    SELECT
        cl.contract_number,
        c.code               AS counterparty_code,
        c.full_name          AS counterparty_name,
        cl.product_type,
        cl.amount,
        cl.currency,
        cl.interest_rate,
        cl.issue_date,
        cl.maturity_date,
        cl.status,
        cl.account_number
    FROM contracts_liabilities cl
    JOIN counterparties c ON c.id = cl.counterparty_id
    WHERE cl.status = 'active'
    ORDER BY cl.id
""")

_QUERY_EXCHANGE_RATES = text("""
    SELECT currency_code, rate_date, rate_to_rub
    FROM exchange_rates
    ORDER BY rate_date DESC
""")

_QUERY_COUNTERPARTIES = text("""
    SELECT
        code,
        full_name,
        short_name,
        inn,
        client_type  AS counterparty_type,
        country_code AS country
    FROM counterparties
    ORDER BY id
""")


class PostgresExtractor:
    """Извлекает данные из имитации банковской АБС."""

    def extract_counterparties(self) -> pd.DataFrame:
        """Возвращает DataFrame всех контрагентов из АБС."""
        log.info("postgres_extractor.extract_counterparties.start")
        with source_session() as session:
            result = session.execute(_QUERY_COUNTERPARTIES)
            df = pd.DataFrame(result.fetchall(), columns=result.keys())
        log.info("postgres_extractor.extract_counterparties.done", rows=len(df))
        return df

    def extract_assets(self) -> pd.DataFrame:
        """Возвращает DataFrame активных активов."""
        log.info("postgres_extractor.extract_assets.start")
        with source_session() as session:
            result = session.execute(_QUERY_ASSETS)
            df = pd.DataFrame(result.fetchall(), columns=result.keys())
        log.info("postgres_extractor.extract_assets.done", rows=len(df))
        return df

    def extract_liabilities(self) -> pd.DataFrame:
        """Возвращает DataFrame активных обязательств."""
        log.info("postgres_extractor.extract_liabilities.start")
        with source_session() as session:
            result = session.execute(_QUERY_LIABILITIES)
            df = pd.DataFrame(result.fetchall(), columns=result.keys())
        log.info("postgres_extractor.extract_liabilities.done", rows=len(df))
        return df

    def extract_exchange_rates(self) -> pd.DataFrame:
        """Возвращает DataFrame курсов валют."""
        log.info("postgres_extractor.extract_exchange_rates.start")
        with source_session() as session:
            result = session.execute(_QUERY_EXCHANGE_RATES)
            df = pd.DataFrame(result.fetchall(), columns=result.keys())
        log.info("postgres_extractor.extract_exchange_rates.done", rows=len(df))
        return df


class ExcelExtractor:
    """
    Извлекает данные из Excel-файлов банковских выгрузок.

    Ожидаемые колонки (строка 2 как заголовок):
      № Договора | Полное наименование контрагента | Краткое наименование |
      ИНН контрагента | Тип контрагента | Тип продукта | Сумма | Валюта |
      Процентная ставка, % | Дата выдачи | Дата погашения | Статус
    """

    # Маппинг русских заголовков -> внутренние имена
    _COLUMN_MAP = {
        "№ Договора":                        "contract_number",
        "Полное наименование контрагента":   "counterparty_name",
        "Краткое наименование":              "counterparty_short_name",
        "ИНН контрагента":                   "counterparty_inn",
        "Тип контрагента":                   "counterparty_type_raw",
        "Тип продукта":                      "product_type_raw",
        "Сумма":                             "amount",
        "Валюта":                            "currency",
        "Процентная ставка, %":              "interest_rate",
        "Дата выдачи":                       "issue_date",
        "Дата погашения":                    "maturity_date",
        "Статус":                            "status",
    }

    # Маппинг русских названий продуктов -> коды из producttyperef
    _PRODUCT_TYPE_MAP = {
        # Активы
        "Кредит корпоративный":    "CREDIT_CORPORATE",
        "Кредит розничный":        "CREDIT_RETAIL",
        "Ипотека":                 "CREDIT_MORTGAGE",
        "Ипотечный кредит":        "CREDIT_MORTGAGE",
        "МБК размещённый":         "IBC_PLACED",
        "ОФЗ":                     "SECURITIES_GOVT",
        "Гос. ценные бумаги":      "SECURITIES_GOVT",
        "Корпоративные облигации": "SECURITIES_CORP",
        "Касса и корр. счета":     "CASH",
        "Депозит в ЦБ РФ":         "CBR_DEPOSIT",
        "Депозит в ЦБ":            "CBR_DEPOSIT",
        # Обязательства
        "Депозит физических лиц":  "DEPOSIT_RETAIL",
        "Депозит физлиц":          "DEPOSIT_RETAIL",
        "Депозит корпоративный":   "DEPOSIT_CORPORATE",
        "Счёт до востребования":   "DEPOSIT_DEMAND",
        "МБК привлечённый":        "IBC_ATTRACTED",
        "Облигации выпущенные":    "BOND_ISSUED",
        "Субординированный займ":  "SUBORD_LOAN",
    }

    def __init__(self, source_dir: Path | None = None):
        self.source_dir = source_dir or app_settings.excel_source_dir

    def _load_file(self, path: Path, category: Category) -> pd.DataFrame:
        """Загружает один Excel-файл, переименовывает колонки, добавляет category."""
        log.info("excel_extractor.load_file", path=str(path))
        df = pd.read_excel(path, header=1)  # строка 1 (0-based) — заголовок
        df = df.rename(columns=self._COLUMN_MAP)

        # Нормализуем ИНН: float 7736050003.0 → строка "7736050003"
        if "counterparty_inn" in df.columns:
            df["counterparty_inn"] = (
                df["counterparty_inn"]
                .apply(lambda x: str(int(x)) if pd.notna(x) and x != "" else None)
            )

        # Оставляем только нужные колонки (могут быть лишние)
        needed = list(self._COLUMN_MAP.values())
        existing = [c for c in needed if c in df.columns]
        df = df[existing].copy()

        # Нормализуем тип продукта к коду
        if "product_type_raw" in df.columns:
            df["product_type"] = (
                df["product_type_raw"]
                .str.strip()
                .map(self._PRODUCT_TYPE_MAP)
            )
            df.drop(columns=["product_type_raw"], inplace=True)

        df["category"] = category
        df["source_file"] = path.name

        # Типы дат
        for col in ("issue_date", "maturity_date"):
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors="coerce").dt.date

        log.info("excel_extractor.load_file.done", path=str(path), rows=len(df))
        return df

    def extract_assets(self) -> pd.DataFrame:
        """Читает все Excel-файлы активов из source_dir."""
        files = sorted(self.source_dir.glob("assets_*.xlsx"))
        if not files:
            log.warning("excel_extractor.no_asset_files", dir=str(self.source_dir))
            return pd.DataFrame()
        frames = [self._load_file(f, "asset") for f in files]
        df = pd.concat(frames, ignore_index=True)
        log.info("excel_extractor.extract_assets.done", rows=len(df), files=len(files))
        return df

    def extract_liabilities(self) -> pd.DataFrame:
        """Читает все Excel-файлы обязательств из source_dir."""
        files = sorted(self.source_dir.glob("liabilities_*.xlsx"))
        if not files:
            log.warning("excel_extractor.no_liability_files", dir=str(self.source_dir))
            return pd.DataFrame()
        frames = [self._load_file(f, "liability") for f in files]
        df = pd.concat(frames, ignore_index=True)
        log.info("excel_extractor.extract_liabilities.done", rows=len(df), files=len(files))
        return df

    def extract_exchange_rates(self) -> pd.DataFrame:
        """Читает курсы валют из exchange_rates.xlsx."""
        path = self.source_dir / "exchange_rates.xlsx"
        if not path.exists():
            log.warning("excel_extractor.no_fx_file", path=str(path))
            return pd.DataFrame()
        df = pd.read_excel(path, header=1)
        df.columns = ["rate_date", "currency_code", "currency_name", "rate_to_rub"]
        df["rate_date"] = pd.to_datetime(df["rate_date"], errors="coerce").dt.date
        log.info("excel_extractor.extract_fx.done", rows=len(df))
        return df
