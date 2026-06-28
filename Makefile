# Единая точка входа для запуска комплекса (бэкенд core + фронтенд).
# Запуск:  make up | make down | make restart | make build | make logs | make ps

DC    ?= docker compose
CORE   = $(DC) -p core -f core/docker-compose.yml
FRONT  = $(DC) -p frontend -f frontend/docker-compose.yaml

.PHONY: up down build restart logs ps

up:
	$(CORE) up -d --build
	$(FRONT) up -d --build
	@echo "Frontend: http://localhost:3000  |  API: http://localhost:8000/docs"

down:
	-$(FRONT) down
	-$(CORE) down

build:
	$(CORE) build
	$(FRONT) build

restart: down up

logs:
	$(CORE) logs -f --tail=50 & $(FRONT) logs -f --tail=50 & wait

ps:
	$(CORE) ps
	$(FRONT) ps
