"""
Генератор тестовых сделок для имитации банковской АБС (source_db).

Наполняет contracts_assets / contracts_liabilities большим объёмом договоров
с реалистичным распределением по срокам и валютам. КОНТРАГЕНТЫ НЕ СОЗДАЮТСЯ —
сделки распределяются по уже существующим контрагентам из seed-данных
(с реалистичной концентрацией: несколько крупных, остальные мельче).

Нужен, чтобы на демонстрации показать работу системы на объёмах, а не на
десятке тестовых записей.

Запуск (внутри контейнера api, где доступен source_db):
    python -m liquidity.datagen --total 200000
    python -m liquidity.datagen --assets 100000 --liabilities 100000 --date 2025-12-01

Повторный запуск перезаписывает только сгенерированные строки (префикс GEN),
штатные демо-данные из seed-файлов не трогаются.
"""
from __future__ import annotations

import argparse
import csv
import io
import random
import sys
import time
from datetime import date, timedelta

ASSET_PRODUCTS = [
    "CREDIT_CORPORATE", "CREDIT_RETAIL", "CREDIT_MORTGAGE", "IBC_PLACED",
    "SECURITIES_GOVT", "SECURITIES_CORP", "CASH", "CBR_DEPOSIT",
]
LIAB_PRODUCTS = [
    "DEPOSIT_RETAIL", "DEPOSIT_CORPORATE", "DEPOSIT_DEMAND",
    "IBC_ATTRACTED", "BOND_ISSUED", "SUBORD_LOAN",
]
ON_DEMAND = {"CASH", "DEPOSIT_DEMAND"}            # для них maturity_date = NULL
BUCKETS = [
    ((1, 1), 0.05), ((2, 7), 0.08), ((8, 30), 0.15), ((31, 90), 0.20),
    ((91, 180), 0.18), ((181, 365), 0.17), ((366, 3650), 0.17),
]
CURRENCIES = [("RUB", 0.80), ("USD", 0.10), ("EUR", 0.07), ("CNY", 0.03)]


def _weighted(choices):
    vals, weights = zip(*choices)
    return random.choices(vals, weights=weights, k=1)[0]


def _maturity(report_date: date, product: str):
    if product in ON_DEMAND:
        return None
    lo, hi = _weighted(BUCKETS)
    return report_date + timedelta(days=random.randint(lo, hi))


def _amount() -> float:
    return round(min(max(random.lognormvariate(17.7, 1.15), 1e4), 5e9), 2)


def _account() -> str:
    return "4" + "".join(str(random.randint(0, 9)) for _ in range(19))


def gen_contracts(n, products, prefix, cp_picks, report_date):
    """cp_picks — заранее насемплированный список id контрагентов длиной n."""
    for i in range(1, n + 1):
        product = random.choice(products)
        cp_id = cp_picks[i - 1]
        mat = _maturity(report_date, product)
        issue = report_date - timedelta(days=random.randint(30, 2000))
        yield (
            f"{prefix}{i}", cp_id, product, f"{_amount():.2f}",
            _weighted(CURRENCIES), f"{random.uniform(4.0, 20.0):.3f}",
            issue.isoformat(), mat.isoformat() if mat else "",
            "active", _account(),
        )


def _copy(cur, table, columns, rows, chunk=50000):
    total = 0
    buf = io.StringIO()
    w = csv.writer(buf)
    cols = ", ".join(columns)
    for r in rows:
        w.writerow(r)
        total += 1
        if total % chunk == 0:
            buf.seek(0)
            cur.copy_expert(f"COPY {table} ({cols}) FROM STDIN WITH (FORMAT csv)", buf)
            buf.seek(0); buf.truncate(0)
    if buf.tell():
        buf.seek(0)
        cur.copy_expert(f"COPY {table} ({cols}) FROM STDIN WITH (FORMAT csv)", buf)
    return total


def _dsn() -> str:
    try:
        from liquidity.config import source_settings
        return source_settings.dsn
    except Exception:
        import os
        return (f"host={os.getenv('SOURCE_DB_HOST','localhost')} "
                f"port={os.getenv('SOURCE_DB_PORT','5435')} "
                f"dbname={os.getenv('SOURCE_DB_NAME','bank_abs')} "
                f"user={os.getenv('SOURCE_DB_USER','abs_user')} "
                f"password={os.getenv('SOURCE_DB_PASSWORD','abs_password')}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Генератор сделок для source_db (АБС). Контрагенты не создаются.")
    ap.add_argument("--total", type=int, default=None,
                    help="Всего сделок (поровну активы/обязательства). Имеет приоритет над --assets/--liabilities.")
    ap.add_argument("--assets", type=int, default=50000)
    ap.add_argument("--liabilities", type=int, default=50000)
    ap.add_argument("--date", default="2025-12-01")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--keep", action="store_true", help="не удалять ранее сгенерированные сделки")
    args = ap.parse_args()

    if args.total is not None:
        args.assets = args.liabilities = max(args.total // 2, 1)

    random.seed(args.seed)
    report_date = date.fromisoformat(args.date)

    try:
        import psycopg2
    except ImportError:
        print("Нужен psycopg2 (есть в зависимостях проекта).", file=sys.stderr)
        sys.exit(1)

    t0 = time.perf_counter()
    conn = psycopg2.connect(_dsn())
    conn.autocommit = False
    cur = conn.cursor()
    try:
        # Используем УЖЕ существующих контрагентов (новые не создаём)
        cur.execute("SELECT id FROM counterparties ORDER BY id")
        cp_ids = [r[0] for r in cur.fetchall()]
        if not cp_ids:
            print("В источнике нет контрагентов — сначала примените seed (db/source_abs).", file=sys.stderr)
            sys.exit(1)

        # Реалистичная концентрация: вес контрагента ~ 1/ранг (Zipf), несколько крупных — остальные мельче
        weights = [1.0 / (i + 1) for i in range(len(cp_ids))]
        def picks(n):
            return random.choices(cp_ids, weights=weights, k=n)

        if not args.keep:
            cur.execute("DELETE FROM contracts_assets WHERE contract_number LIKE 'GEN-A-%'")
            cur.execute("DELETE FROM contracts_liabilities WHERE contract_number LIKE 'GEN-L-%'")

        for c, rate in (("RUB", 1.0), ("USD", 89.25), ("EUR", 96.40), ("CNY", 12.15)):
            cur.execute("INSERT INTO exchange_rates (currency_code, rate_date, rate_to_rub) "
                        "VALUES (%s,%s,%s) ON CONFLICT (currency_code, rate_date) DO NOTHING",
                        (c, report_date, rate))

        cols = ["contract_number", "counterparty_id", "product_type", "amount", "currency",
                "interest_rate", "issue_date", "maturity_date", "status", "account_number"]
        na = _copy(cur, "contracts_assets", cols,
                   gen_contracts(args.assets, ASSET_PRODUCTS, "GEN-A-", picks(args.assets), report_date))
        nl = _copy(cur, "contracts_liabilities", cols,
                   gen_contracts(args.liabilities, LIAB_PRODUCTS, "GEN-L-", picks(args.liabilities), report_date))

        conn.commit()
        dt = time.perf_counter() - t0
        print(f"Сгенерировано за {dt:.1f} c | контрагентов в источнике: {len(cp_ids)} (не менялись) | "
              f"активов: {na} | обязательств: {nl} | всего сделок: {na + nl}")
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
