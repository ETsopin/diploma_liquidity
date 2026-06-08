# Система автоматизированного формирования отчётности по структурной ликвидности

Дипломный проект. Реализует полный цикл: **ETL → Хранилище данных → Расчётное ядро → REST API → Отчёты**.

---

## Архитектура

```
┌──────────────┐    ┌──────────────┐    ┌─────────────────────────────────┐
│  source_db   │    │  Excel-файлы │    │         liquidity_dwh            │
│ (bank_abs)   │    │ data/excel/  │    │  staging / dwh / mart / audit    │
│  port 5435   │    └──────┬───────┘    └──────────────────────────────────┘
└──────┬───────┘           │                         ▲
       │         ETL Pipeline                        │
       └──────────────────►├────── Extract ──────────┤
                           ├────── Transform ─────────┤
                           └────── Load ──────────────┘
                                                      │
                                          CorePipeline (расчёты)
                                          • GapCalculator
                                          • ConcentrationCalculator
                                                      │
                                          ReportGenerator
                                          • Excel (.xlsx)
                                          • PDF   (.pdf)
                                          • CSV   (.csv)
                                                      │
                                          FastAPI REST API
                                          port 8000
```

### Схемы PostgreSQL

| Схема     | Назначение                                               |
|-----------|----------------------------------------------------------|
| `staging` | Сырые данные после ETL (буфер перед DWH)                 |
| `dwh`     | Нормализованное хранилище (факты, справочники, расчёты)  |
| `mart`    | Витрины данных (денормализовано для API/фронта)           |
| `audit`   | Журналы ETL, пользователи, источники данных              |

---

## Быстрый старт

### 1. Требования

- Docker + Docker Compose
- Python 3.10+ и [uv](https://github.com/astral-sh/uv): `pip install uv`

### 2. Настройка окружения

```bash
cd liquidity_system
cp .env.example .env
# Отредактируй .env при необходимости
```

### 3. Запуск баз данных

```bash
docker-compose up -d dwh_db source_db
# Подождать ~10 секунд, пока БД инициализируются
docker-compose ps   # оба должны быть healthy
```

### 4. Установка Python-зависимостей

```bash
uv sync
```

### 5. Проверка окружения

```bash
uv run python scripts/verify.py
```

Ожидаемый вывод:
```
✓ DWH подключение OK
✓ Source DB подключение OK
✓ audit.users: 1 строк
✓ dwh.timebucket: 8 строк
✓ source_db contracts_assets: 19 строк
...
Все проверки прошли успешно!
```

---

## Рабочий процесс

### Шаг 1: Запуск ETL

Загружает данные из АБС PostgreSQL и Excel-файлов в DWH.

```bash
# Полный ETL (оба источника)
uv run etl --date 2025-12-01

# Только PostgreSQL АБС
uv run etl --date 2025-12-01 --source postgres

# Только Excel
uv run etl --date 2025-12-01 --source excel
```

### Шаг 2: Запуск расчётного ядра

```bash
# Полный расчёт: ГЭП + концентрация
uv run calculate --date 2025-12-01 --type full

# Только ГЭП-анализ
uv run calculate --date 2025-12-01 --type gap

# Только концентрация
uv run calculate --date 2025-12-01 --type concentration
```

### Шаг 3: Генерация отчёта

```bash
# Excel (по умолчанию)
uv run report --date 2025-12-01

# PDF
uv run report --date 2025-12-01 --format pdf

# CSV (создаёт два файла: _gap.csv и _concentration.csv)
uv run report --date 2025-12-01 --format csv

# Только ГЭП, в конкретную папку
uv run report --date 2025-12-01 --type gap --output-dir ./output
```

Файлы сохраняются в `data/reports/`.

---

## REST API

### Запуск API-сервера

```bash
# Через uv (для разработки, с hot-reload)
uv run python -m uvicorn liquidity.api.app:app --reload --port 8000

# Полный стек через Docker Compose
docker-compose up
```

Swagger UI: http://localhost:8000/docs

### Аутентификация

Все эндпоинты (кроме `/health`) требуют заголовок:
```
X-API-Key: change_me_in_production
```

Значение задаётся переменной `SECRET_KEY` в `.env`.

### Эндпоинты

#### System
| Метод | Путь      | Описание                 |
|-------|-----------|--------------------------|
| GET   | `/health` | Healthcheck (БД, сервис) |

#### ETL
| Метод | Путь                | Описание                   |
|-------|---------------------|----------------------------|
| POST  | `/etl/run`          | Запустить ETL-процесс      |
| GET   | `/etl/batches`      | История загрузок           |
| GET   | `/etl/batches/{id}` | Детали пакета загрузки     |

**Пример запроса:**
```json
POST /etl/run
{
  "source": "all",
  "report_date": "2025-12-01"
}
```

#### Расчёты
| Метод | Путь                                 | Описание                    |
|-------|--------------------------------------|-----------------------------|
| POST  | `/calculations`                      | Запустить расчёт            |
| GET   | `/calculations`                      | История расчётов            |
| GET   | `/calculations/{id}`                 | Детали расчёта              |
| GET   | `/calculations/gap/{date}`           | Результаты ГЭП-анализа      |
| GET   | `/calculations/concentration/{date}` | Результаты концентрации     |

**Пример ответа ГЭП:**
```json
{
  "report_date": "2025-12-01",
  "calculation_id": 1,
  "buckets": [
    {
      "bucket_code": "ON_DEMAND",
      "bucket_name": "До востребования",
      "total_assets_rub": 1500000.00,
      "total_liabilities_rub": 3200000.00,
      "gap_rub": -1700000.00,
      "cumulative_gap_rub": -1700000.00,
      "gap_ratio_pct": -53.125
    }
  ],
  "total_assets": 45000000.00,
  "total_liabilities": 38000000.00,
  "net_gap": 7000000.00
}
```

#### Отчёты
| Метод | Путь                     | Описание                        |
|-------|--------------------------|---------------------------------|
| POST  | `/reports/generate`      | Сгенерировать отчёт             |
| GET   | `/reports`               | История задач генерации         |
| GET   | `/reports/{id}`          | Детали задачи                   |
| GET   | `/reports/{id}/download` | Скачать файл отчёта             |

**Пример запроса:**
```json
POST /reports/generate
{
  "report_date": "2025-12-01",
  "report_type": "full",
  "report_format": "excel"
}
```

#### Справочники
| Метод | Путь                          | Описание               |
|-------|-------------------------------|------------------------|
| GET   | `/references/timebuckets`     | Временные корзины ЦБ РФ|
| GET   | `/references/counterparties`  | Список контрагентов    |

---

## Структура проекта

```
liquidity_system/
├── docker-compose.yml          # Контейнеры: dwh_db, source_db, api
├── Dockerfile                  # Образ для API-сервиса
├── pyproject.toml              # Зависимости и CLI-команды
├── .env.example                # Шаблон конфигурации
│
├── db/
│   ├── dwh/migrations/         # DDL для DWH (01_schema.sql, 02_seed.sql)
│   └── source_abs/             # DDL и данные для имитации АБС
│
├── data/
│   ├── excel_sources/          # Excel-файлы банковских выгрузок
│   └── reports/                # Сгенерированные отчёты (создаётся автоматически)
│
├── scripts/
│   ├── verify.py               # Проверка окружения
│   └── seed_db.py              # Ручное заполнение БД
│
└── liquidity/                  # Python-пакет
    ├── config.py               # Конфигурация (pydantic-settings)
    ├── db.py                   # Подключения к БД (SQLAlchemy)
    ├── logger.py               # Структурное логирование (structlog)
    │
    ├── etl/
    │   ├── extractor.py        # Извлечение из PostgreSQL и Excel
    │   ├── transformer.py      # Очистка, нормализация, справочники
    │   ├── loader.py           # Загрузка в staging и DWH
    │   └── pipeline.py         # Оркестратор ETL + CLI (uv run etl)
    │
    ├── core/
    │   ├── gap_calculator.py           # ГЭП-анализ по временным корзинам
    │   ├── concentration_calculator.py # Концентрация по контрагентам
    │   └── pipeline.py                 # Оркестратор + CLI (uv run calculate)
    │
    ├── reports/
    │   └── generator.py        # Генерация Excel/PDF/CSV + CLI (uv run report)
    │
    └── api/
        ├── app.py              # FastAPI-приложение
        ├── deps.py             # Зависимости (аутентификация, пагинация)
        ├── schemas.py          # Pydantic-схемы запросов/ответов
        └── routers/
            ├── health.py       # GET /health
            ├── etl.py          # ETL-управление
            ├── calculations.py # Расчёты и результаты
            ├── reports.py      # Генерация и скачивание отчётов
            └── references.py   # Справочники
```

---

## Конфигурация (.env)

| Переменная           | По умолчанию           | Описание                          |
|----------------------|------------------------|-----------------------------------|
| `DWH_DB_HOST`        | `localhost`            | Хост DWH                          |
| `DWH_DB_PORT`        | `5434`                 | Порт DWH                          |
| `DWH_DB_NAME`        | `liquidity_dwh`        | Имя БД                            |
| `DWH_DB_USER`        | `dwh_user`             | Пользователь DWH                  |
| `DWH_DB_PASSWORD`    | `dwh_password`         | Пароль DWH                        |
| `SOURCE_DB_HOST`     | `localhost`            | Хост АБС                          |
| `SOURCE_DB_PORT`     | `5435`                 | Порт АБС                          |
| `SOURCE_DB_NAME`     | `bank_abs`             | Имя БД АБС                        |
| `SOURCE_DB_USER`     | `abs_user`             | Пользователь АБС                  |
| `SOURCE_DB_PASSWORD` | `abs_password`         | Пароль АБС                        |
| `SECRET_KEY`         | `change_me_in_production` | API-ключ аутентификации        |
| `LOG_LEVEL`          | `INFO`                 | Уровень логирования               |
| `EXCEL_SOURCE_DIR`   | `./data/excel_sources` | Каталог Excel-файлов              |
| `REPORTS_OUTPUT_DIR` | `./data/reports`       | Каталог для отчётов               |

---

## Временны́е корзины ЦБ РФ

| Код              | Название               | Диапазон       |
|------------------|------------------------|----------------|
| `ON_DEMAND`      | До востребования       | 0 дней         |
| `UP_TO_1_MONTH`  | До 1 месяца            | 1–30 дней      |
| `1_TO_3_MONTHS`  | От 1 до 3 месяцев      | 31–90 дней     |
| `3_TO_6_MONTHS`  | От 3 до 6 месяцев      | 91–180 дней    |
| `6_TO_12_MONTHS` | От 6 до 12 месяцев     | 181–365 дней   |
| `1_TO_3_YEARS`   | От 1 года до 3 лет     | 366–1095 дней  |
| `3_TO_5_YEARS`   | От 3 до 5 лет          | 1096–1825 дней |
| `OVER_5_YEARS`   | Свыше 5 лет            | >1825 дней     |

---

## Подключение к БД через DataGrip

| БД          | Host      | Port | Database      | User     |
|-------------|-----------|------|---------------|----------|
| DWH         | localhost | 5434 | liquidity_dwh | dwh_user |
| АБС (source)| localhost | 5435 | bank_abs      | abs_user |

> В DataGrip: правый клик на соединении → **Schemas** → выбрать все схемы.
