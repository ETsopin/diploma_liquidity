#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Единая точка входа для запуска всего комплекса: бэкенд (core) + фронтенд.
#
# Порядок важен: сначала поднимается core (БД + API) — он создаёт docker-сеть
# core_liquidity_net, к которой фронтенд подключается как к внешней.
#
# Использование:
#   ./run.sh up                          — собрать и запустить всё (по умолчанию)
#   ./run.sh up --deals 200000           — запустить и сгенерировать 200000 сделок в АБС
#   ./run.sh up --deals 200000 --load    — то же + сразу прогнать ETL и расчёт
#   ./run.sh up --deals 100000 --date 2025-12-01
#   ./run.sh down      — остановить всё
#   ./run.sh restart   — перезапустить
#   ./run.sh build     — только пересобрать образы
#   ./run.sh logs      — смотреть логи обоих проектов
#   ./run.sh ps        — статус контейнеров
#
# Флаги для up:
#   --deals N    сколько сделок сгенерировать в источнике (АБС). 0 = не генерировать.
#   --date D     отчётная дата (по умолчанию 2025-12-01).
#   --load       после генерации сразу выполнить ETL-загрузку и расчёт.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

# Выбор клиента: docker compose (v2) или docker-compose (v1)
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "Ошибка: не найден Docker Compose. Установите Docker Desktop." >&2
  exit 1
fi

# Явные имена проектов: благодаря '-p core' сеть называется именно
# core_liquidity_net — её и ожидает фронтенд (external network).
CORE="$DC -p core -f core/docker-compose.yml"
FRONT="$DC -p frontend -f frontend/docker-compose.yaml"

cmd="${1:-up}"; shift || true

# Флаги для up
DEALS=0; DATE="2025-12-01"; LOAD=0
while [ $# -gt 0 ]; do
  case "$1" in
    --deals) DEALS="${2:-0}"; shift 2 ;;
    --date)  DATE="${2:-2025-12-01}"; shift 2 ;;
    --load)  LOAD=1; shift ;;
    *) echo "Неизвестный флаг: $1" >&2; exit 1 ;;
  esac
done

case "$cmd" in
  up)
    echo ">> [1/2] Запуск бэкенда (PostgreSQL DWH + АБС + API)…"
    $CORE up -d --build
    echo ">> [2/2] Запуск фронтенда (Next.js + MongoDB)…"
    $FRONT up -d --build

    if [ "$DEALS" -gt 0 ]; then
      echo ">> Ожидание готовности БД-источника…"
      for _ in $(seq 1 30); do
        if $CORE exec -T source_db pg_isready -U "${SOURCE_DB_USER:-abs_user}" >/dev/null 2>&1; then break; fi
        sleep 2
      done
      echo ">> Генерация $DEALS сделок в АБС (дата $DATE)…"
      $CORE exec -T api python -m liquidity.datagen --total "$DEALS" --date "$DATE"
      if [ "$LOAD" = "1" ]; then
        echo ">> ETL-загрузка в хранилище…"
        $CORE exec -T api etl --date "$DATE"
        echo ">> Расчёт показателей…"
        $CORE exec -T api calculate --date "$DATE"
      fi
    fi

    echo ""
    echo "Готово. Сервисы:"
    echo "  Frontend : http://localhost:3000"
    echo "  API      : http://localhost:8000   (Swagger: http://localhost:8000/docs)"
    echo "  DWH (PG) : localhost:5434   АБС (PG): localhost:5435   Mongo: localhost:27017"
    [ "$DEALS" -gt 0 ] && [ "$LOAD" != "1" ] && echo "  Данные сгенерированы в АБС. Запусти ETL и расчёт из приложения (или повтори с --load)."
    ;;
  down)
    echo ">> Остановка фронтенда…"
    $FRONT down || true
    echo ">> Остановка бэкенда…"
    $CORE down || true
    echo "Остановлено. (Данные в томах сохранены. Полная очистка: ./run.sh down && docker volume prune)"
    ;;
  build)
    $CORE build
    $FRONT build
    ;;
  restart)
    "$0" down
    "$0" up
    ;;
  logs)
    echo "Логи (Ctrl+C — выход):"
    $CORE logs -f --tail=50 &
    $FRONT logs -f --tail=50 &
    wait
    ;;
  ps)
    echo "== core ==";     $CORE ps
    echo "== frontend =="; $FRONT ps
    ;;
  *)
    echo "Использование: $0 {up|down|build|restart|logs|ps}" >&2
    exit 1
    ;;
esac
