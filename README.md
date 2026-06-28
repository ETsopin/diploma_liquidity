# Запуск программного комплекса (бэкенд + фронтенд)

Комплекс состоит из двух частей, каждая со своим `docker-compose`:

- `core/` — серверная часть: PostgreSQL (DWH), имитация АБС, REST API (FastAPI). Создаёт docker-сеть `core_liquidity_net`.
- `frontend/` — клиентская часть: Next.js + MongoDB. Подключается к сети `core_liquidity_net` как к внешней (обращается к API по адресу `http://api:8000`).

Из-за этого порядок важен: **сначала `core`, потом `frontend`**. Для удобства добавлена единая точка входа.

## Быстрый старт

Любой из вариантов запускает обе части одной командой:

```bash
./run.sh up        # скрипт (универсально, без зависимостей)
# или
make up            # то же самое через Makefile
```

После запуска:

| Сервис | Адрес |
|--------|-------|
| Фронтенд (Next.js) | http://localhost:3000 |
| REST API (FastAPI) | http://localhost:8000 · Swagger: http://localhost:8000/docs |
| PostgreSQL DWH | localhost:5434 |
| PostgreSQL АБС (источник) | localhost:5435 |
| MongoDB | localhost:27017 |

## Команды

| Действие | Скрипт | Makefile |
|----------|--------|----------|
| Запустить всё | `./run.sh up` | `make up` |
| Остановить всё | `./run.sh down` | `make down` |
| Перезапустить | `./run.sh restart` | `make restart` |
| Пересобрать образы | `./run.sh build` | `make build` |
| Логи обоих проектов | `./run.sh logs` | `make logs` |
| Статус контейнеров | `./run.sh ps` | `make ps` |

`down` останавливает контейнеры, но **сохраняет данные** в томах (`dwh_data`, `source_data`, `mongo_data`).
Полная очистка с удалением данных: `./run.sh down && docker volume prune`.

> Существующие `core/docker-compose.yml` и `frontend/docker-compose.yaml` не изменялись — единая точка входа лишь запускает их в правильном порядке с явными именами проектов (`-p core`, `-p frontend`), чтобы имя сети совпадало с ожидаемым `core_liquidity_net`.
