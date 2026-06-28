#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Единая точка входа для запуска всего комплекса: бэкенд (core) + фронтенд.
#
# Порядок важен: сначала поднимается core (БД + API) — он создаёт docker-сеть
# core_liquidity_net, к которой фронтенд подключается как к внешней.
#
# Использование:
#   ./run.sh up        — собрать и запустить всё (по умолчанию)
#   ./run.sh down      — остановить всё
#   ./run.sh restart   — перезапустить
#   ./run.sh build     — только пересобрать образы
#   ./run.sh logs      — смотреть логи обоих проектов
#   ./run.sh ps        — статус контейнеров
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

cmd="${1:-up}"
case "$cmd" in
  up)
    echo ">> [1/2] Запуск бэкенда (PostgreSQL DWH + АБС + API)…"
    $CORE up -d --build
    echo ">> [2/2] Запуск фронтенда (Next.js + MongoDB)…"
    $FRONT up -d --build
    echo ""
    echo "Готово. Сервисы:"
    echo "  Frontend : http://localhost:3000"
    echo "  API      : http://localhost:8000   (Swagger: http://localhost:8000/docs)"
    echo "  DWH (PG) : localhost:5434   АБС (PG): localhost:5435   Mongo: localhost:27017"
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
