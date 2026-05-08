#!/usr/bin/env python3
"""
Ручной засев баз данных из Python.

Выполняет DDL и seed SQL-файлы напрямую через psycopg2.
Используй если:
  - docker-entrypoint-initdb.d не отработал (контейнер уже существовал)
  - нужно сбросить и пересеять данные заново

Запуск:
    uv run python scripts/seed_db.py [--reset] [--target dwh|source|all]
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import click

# ---------------------------------------------------------------------------
# Добавляем корень проекта в sys.path чтобы импорт работал без установки
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from liquidity.config import dwh_settings, source_settings  # noqa: E402

try:
    import psycopg2
    from psycopg2 import sql
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
except ImportError:
    print("psycopg2 не найден. Установи зависимости: uv sync")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Пути к SQL-файлам
# ---------------------------------------------------------------------------
DB_DIR = ROOT / "db"

DWH_SCRIPTS = [
    DB_DIR / "dwh" / "migrations" / "01_create_schema.sql",
    DB_DIR / "dwh" / "migrations" / "02_seed_references.sql",
]

SOURCE_SCRIPTS = [
    DB_DIR / "source_abs" / "01_create_abs_schema.sql",
    DB_DIR / "source_abs" / "02_seed_abs_data.sql",
]


# ---------------------------------------------------------------------------
# Вспомогательные функции
# ---------------------------------------------------------------------------

def wait_for_db(dsn: str, name: str, retries: int = 15, delay: float = 2.0) -> None:
    """Ждёт, пока PostgreSQL не станет доступен."""
    print(f"  Ожидаю подключения к {name}", end="", flush=True)
    for attempt in range(retries):
        try:
            conn = psycopg2.connect(dsn)
            conn.close()
            print(" OK")
            return
        except psycopg2.OperationalError:
            print(".", end="", flush=True)
            time.sleep(delay)
    print(" TIMEOUT")
    raise RuntimeError(f"Не удалось подключиться к {name} за {retries} попыток")


def run_sql_file(conn, path: Path) -> None:
    """Выполняет SQL-файл целиком в одной транзакции."""
    sql_text = path.read_text(encoding="utf-8")
    with conn.cursor() as cur:
        cur.execute(sql_text)
    conn.commit()
    print(f"    ✓ {path.name}")


def drop_and_recreate_schemas(conn, schemas: list[str]) -> None:
    """Дропает схемы CASCADE и создаёт заново."""
    with conn.cursor() as cur:
        for schema in schemas:
            cur.execute(f"DROP SCHEMA IF EXISTS {schema} CASCADE")
            cur.execute(f"CREATE SCHEMA {schema}")
    conn.commit()
    print(f"    ✓ Схемы пересозданы: {schemas}")


def drop_all_tables(conn) -> None:
    """Дропает все таблицы в публичной схеме source_db (без схем)."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT tablename FROM pg_tables
            WHERE schemaname = 'public'
        """)
        tables = [row[0] for row in cur.fetchall()]
        for t in tables:
            cur.execute(f'DROP TABLE IF EXISTS public."{t}" CASCADE')
    conn.commit()
    if tables:
        print(f"    ✓ Удалены таблицы: {tables}")


# ---------------------------------------------------------------------------
# Команды
# ---------------------------------------------------------------------------

def seed_dwh(reset: bool) -> None:
    print("\n[DWH] Подключение к основной БД...")
    dsn = dwh_settings.dsn
    wait_for_db(dsn, "dwh_db")

    conn = psycopg2.connect(dsn)
    conn.autocommit = False

    if reset:
        print("  [RESET] Удаляю схемы DWH...")
        drop_and_recreate_schemas(conn, ["staging", "dwh", "mart", "audit"])

    print("  Выполняю DDL и seed-скрипты:")
    for script in DWH_SCRIPTS:
        if not script.exists():
            print(f"    ! Файл не найден: {script}")
            continue
        run_sql_file(conn, script)

    conn.close()
    print("[DWH] Готово.\n")


def seed_source(reset: bool) -> None:
    print("[SOURCE АБС] Подключение к имитации АБС...")
    dsn = source_settings.dsn
    wait_for_db(dsn, "source_db")

    conn = psycopg2.connect(dsn)
    conn.autocommit = False

    if reset:
        print("  [RESET] Удаляю таблицы source_db...")
        drop_all_tables(conn)

    print("  Выполняю DDL и seed-скрипты:")
    for script in SOURCE_SCRIPTS:
        if not script.exists():
            print(f"    ! Файл не найден: {script}")
            continue
        run_sql_file(conn, script)

    conn.close()
    print("[SOURCE АБС] Готово.\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

@click.command()
@click.option(
    "--target",
    type=click.Choice(["dwh", "source", "all"]),
    default="all",
    show_default=True,
    help="Какую БД заполнять.",
)
@click.option(
    "--reset",
    is_flag=True,
    default=False,
    help="Удалить существующие данные перед заполнением (осторожно!).",
)
def main(target: str, reset: bool) -> None:
    """Ручное заполнение баз данных DDL + seed-скриптами."""
    if reset:
        click.confirm(
            "⚠️  Флаг --reset удалит все существующие данные. Продолжить?",
            abort=True,
        )

    try:
        if target in ("dwh", "all"):
            seed_dwh(reset)
        if target in ("source", "all"):
            seed_source(reset)
        print("✅ Заполнение завершено успешно.")
    except Exception as exc:
        print(f"\n❌ Ошибка: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
