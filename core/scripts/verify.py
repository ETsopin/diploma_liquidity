#!/usr/bin/env python3
"""
Проверка состояния всего окружения.

Проверяет:
  1. Подключение к dwh_db и source_db
  2. Количество строк во всех таблицах обеих БД
  3. Содержимое Excel-файлов (строки, колонки, диапазоны дат)
  4. Тестовый прогон ReferenceCache (справочники)

Запуск:
    uv run python scripts/verify.py
    uv run python scripts/verify.py --verbose
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import click

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from liquidity.config import dwh_settings, source_settings, app_settings  # noqa: E402

try:
    import psycopg2
except ImportError:
    print("psycopg2 не найден. Установи зависимости: uv sync")
    sys.exit(1)

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

# ---------------------------------------------------------------------------
# Цвета / символы вывода
# ---------------------------------------------------------------------------
OK   = "✅"
FAIL = "❌"
WARN = "⚠️ "
HDR  = "─" * 60


def _green(s: str) -> str:
    return f"\033[32m{s}\033[0m"

def _red(s: str) -> str:
    return f"\033[31m{s}\033[0m"

def _bold(s: str) -> str:
    return f"\033[1m{s}\033[0m"


# ---------------------------------------------------------------------------
# Проверка подключения к БД
# ---------------------------------------------------------------------------

def check_connection(dsn: str, name: str) -> bool:
    try:
        conn = psycopg2.connect(dsn + " connect_timeout=5")
        conn.close()
        print(f"  {OK} {name} — подключение успешно")
        return True
    except psycopg2.OperationalError as e:
        print(f"  {FAIL} {name} — {_red(str(e).strip())}")
        return False


# ---------------------------------------------------------------------------
# Количество строк в таблицах
# ---------------------------------------------------------------------------

DWH_TABLES = [
    ("audit",   "users"),
    ("audit",   "datasource"),
    ("audit",   "rawdatabatch"),
    ("dwh",     "counterpartyref"),
    ("dwh",     "producttyperef"),
    ("dwh",     "timebucket"),
    ("staging", "stagingasset"),
    ("staging", "stagingliability"),
    ("dwh",     "asset"),
    ("dwh",     "liability"),
    ("dwh",     "gapcalculation"),
    ("dwh",     "gapresult"),
    ("dwh",     "concentrationresult"),
    ("dwh",     "reporttask"),
    ("mart",    "liquidity_gap_view"),
]

SOURCE_TABLES = [
    ("public", "counterparties"),
    ("public", "contracts_assets"),
    ("public", "contracts_liabilities"),
    ("public", "account_balances"),
    ("public", "exchange_rates"),
]

# Таблицы, в которых ожидаем данные сразу после seed
EXPECTED_NON_EMPTY = {
    ("dwh",    "timebucket"):        8,
    ("dwh",    "producttyperef"):    14,
    ("audit",  "datasource"):        3,
    ("audit",  "users"):             1,
    ("public", "counterparties"):    10,
    ("public", "contracts_assets"):  19,
    ("public", "contracts_liabilities"): 17,
    ("public", "exchange_rates"):    4,
}


def check_tables(dsn: str, tables: list[tuple[str, str]], verbose: bool) -> dict:
    results = {}
    try:
        conn = psycopg2.connect(dsn + " connect_timeout=5")
        conn.autocommit = True
        cur = conn.cursor()
        for schema, table in tables:
            fq = f'"{schema}"."{table}"'
            try:
                cur.execute(f"SELECT COUNT(*) FROM {fq}")
                count = cur.fetchone()[0]
                results[(schema, table)] = count
            except psycopg2.Error as e:
                results[(schema, table)] = f"ERROR: {e.pgerror or str(e)}"
        cur.close()
        conn.close()
    except psycopg2.OperationalError:
        pass  # соединение уже провалилось выше
    return results


def print_table_counts(
    counts: dict,
    tables: list[tuple[str, str]],
    verbose: bool,
) -> int:
    """Выводит таблицу со счётчиками. Возвращает количество проблем."""
    issues = 0
    col_w = max(len(f"{s}.{t}") for s, t in tables) + 2

    for schema, table in tables:
        key = (schema, table)
        count = counts.get(key, "N/A")
        fq = f"{schema}.{table}"
        expected = EXPECTED_NON_EMPTY.get(key)

        if isinstance(count, str) and count.startswith("ERROR"):
            icon = FAIL
            status = _red(count)
            issues += 1
        elif isinstance(count, int):
            if expected is not None and count < expected:
                icon = WARN
                status = _red(f"{count} строк  ← ожидалось ≥{expected}")
                issues += 1
            elif expected is not None and count >= expected:
                icon = OK
                status = _green(f"{count} строк")
            else:
                # Таблица без ожидаемого минимума
                icon = "  " if count == 0 else OK
                status = f"{count} строк"
        else:
            icon = WARN
            status = str(count)
            issues += 1

        if verbose or (icon in (FAIL, WARN)):
            print(f"  {icon}  {fq:<{col_w}} {status}")
        elif icon == OK:
            print(f"  {icon}  {fq:<{col_w}} {status}")

    return issues


# ---------------------------------------------------------------------------
# Проверка Excel-файлов
# ---------------------------------------------------------------------------

EXCEL_FILES = {
    "assets_2025_12_01.xlsx": {
        "header_row": 1,
        "min_rows": 5,
        "required_cols": ["№ Договора", "Сумма", "Валюта", "Дата погашения"],
    },
    "liabilities_2025_12_01.xlsx": {
        "header_row": 1,
        "min_rows": 5,
        "required_cols": ["№ Договора", "Сумма", "Валюта", "Дата погашения"],
    },
    "exchange_rates.xlsx": {
        "header_row": 1,
        "min_rows": 3,
        "required_cols": ["Дата", "Код валюты", "Курс к рублю"],
    },
}


def check_excel_files(verbose: bool) -> int:
    if not HAS_PANDAS:
        print(f"  {WARN} pandas не установлен, пропускаю проверку Excel")
        return 0

    issues = 0
    excel_dir = app_settings.excel_source_dir

    for filename, cfg in EXCEL_FILES.items():
        path = excel_dir / filename
        if not path.exists():
            print(f"  {FAIL} {filename} — файл не найден ({path})")
            issues += 1
            continue
        try:
            df = pd.read_excel(path, header=cfg["header_row"])
            rows = len(df)
            cols = list(df.columns)

            missing = [c for c in cfg["required_cols"] if c not in cols]
            if missing:
                print(f"  {FAIL} {filename} — отсутствуют колонки: {missing}")
                issues += 1
                continue

            if rows < cfg["min_rows"]:
                print(f"  {WARN} {filename} — мало строк: {rows} (ожидалось ≥{cfg['min_rows']})")
                issues += 1
                continue

            print(f"  {OK} {filename} — {rows} строк, {len(cols)} колонок")

            if verbose:
                # Детализация по суммам и датам
                if "Сумма" in cols:
                    total = df["Сумма"].sum()
                    print(f"       Сумма итого: {total:,.0f}")
                if "Дата погашения" in cols:
                    dates = pd.to_datetime(df["Дата погашения"], errors="coerce").dropna()
                    if not dates.empty:
                        print(f"       Даты погашения: {dates.min().date()} … {dates.max().date()}")
                if "Код валюты" in cols:
                    vals = df["Код валюты"].dropna().unique().tolist()
                    print(f"       Валюты: {vals}")
                if "Валюта" in cols:
                    vals = df["Валюта"].dropna().unique().tolist()
                    print(f"       Валюты: {vals}")

        except Exception as e:
            print(f"  {FAIL} {filename} — ошибка чтения: {e}")
            issues += 1

    return issues


# ---------------------------------------------------------------------------
# Проверка тестового подключения к DWH через SQLAlchemy
# ---------------------------------------------------------------------------

def check_sqlalchemy_dwh() -> bool:
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(dwh_settings.url, connect_args={"connect_timeout": 5})
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT code, name FROM dwh.timebucket ORDER BY sort_order"
            )).fetchall()
        print(f"  {OK} SQLAlchemy DWH — timebucket: {[r.code for r in result]}")
        return True
    except Exception as e:
        print(f"  {FAIL} SQLAlchemy DWH — {_red(str(e).strip())}")
        return False


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

@click.command()
@click.option("--verbose", "-v", is_flag=True, help="Подробный вывод.")
def main(verbose: bool) -> None:
    """Проверка состояния окружения: БД, таблицы, Excel-файлы."""
    total_issues = 0

    # ------------------------------------------------------------------
    print(_bold(f"\n{HDR}"))
    print(_bold("  1. ПОДКЛЮЧЕНИЯ К БД"))
    print(HDR)
    dwh_ok     = check_connection(dwh_settings.dsn,    "dwh_db    (порт 5432)")
    source_ok  = check_connection(source_settings.dsn, "source_db (порт 5433)")
    if not dwh_ok or not source_ok:
        total_issues += 1

    # ------------------------------------------------------------------
    print(_bold(f"\n{HDR}"))
    print(_bold("  2. ТАБЛИЦЫ DWH (liquidity_dwh)"))
    print(HDR)
    if dwh_ok:
        dwh_counts = check_tables(dwh_settings.dsn, DWH_TABLES, verbose)
        issues = print_table_counts(dwh_counts, DWH_TABLES, verbose)
        total_issues += issues
        if issues == 0:
            print(f"\n  {OK} Все таблицы DWH в порядке")
        else:
            print(f"\n  {FAIL} Проблем: {issues}. Попробуй: uv run python scripts/seed_db.py")
    else:
        print(f"  {WARN} Пропускаю — нет подключения к DWH")

    # ------------------------------------------------------------------
    print(_bold(f"\n{HDR}"))
    print(_bold("  3. ТАБЛИЦЫ SOURCE АБС (bank_abs)"))
    print(HDR)
    if source_ok:
        src_counts = check_tables(source_settings.dsn, SOURCE_TABLES, verbose)
        issues = print_table_counts(src_counts, SOURCE_TABLES, verbose)
        total_issues += issues
        if issues == 0:
            print(f"\n  {OK} Все таблицы АБС в порядке")
        else:
            print(f"\n  {FAIL} Проблем: {issues}. Попробуй: uv run python scripts/seed_db.py --target source")
    else:
        print(f"  {WARN} Пропускаю — нет подключения к source_db")

    # ------------------------------------------------------------------
    print(_bold(f"\n{HDR}"))
    print(_bold("  4. EXCEL-ФАЙЛЫ"))
    print(HDR)
    issues = check_excel_files(verbose)
    total_issues += issues
    if issues == 0:
        print(f"\n  {OK} Все Excel-файлы в порядке")

    # ------------------------------------------------------------------
    print(_bold(f"\n{HDR}"))
    print(_bold("  5. SQLALCHEMY + СПРАВОЧНИКИ DWH"))
    print(HDR)
    if dwh_ok:
        if not check_sqlalchemy_dwh():
            total_issues += 1
    else:
        print(f"  {WARN} Пропускаю — нет подключения к DWH")

    # ------------------------------------------------------------------
    print(f"\n{HDR}")
    if total_issues == 0:
        print(_bold(_green(f"  {OK} Всё готово к работе!")))
    else:
        print(_bold(_red(f"  {FAIL} Обнаружено проблем: {total_issues}")))
        print("  Для заполнения БД запусти: uv run python scripts/seed_db.py")
        print("  Если контейнеры не запущены: docker-compose up -d")
    print(HDR + "\n")

    sys.exit(0 if total_issues == 0 else 1)


if __name__ == "__main__":
    main()
