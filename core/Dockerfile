FROM python:3.11-slim

WORKDIR /app

# Системные зависимости
# fonts-dejavu-core — TTF-шрифт с кириллицей для генерации PDF-отчётов (ReportLab)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем uv
RUN pip install uv --no-cache-dir

# Копируем только файлы зависимостей — для кэша слоёв
COPY pyproject.toml ./

# Устанавливаем зависимости (без dev)
RUN uv pip install --system --no-cache-dir -e .

# Копируем исходный код
COPY liquidity/ ./liquidity/
COPY data/       ./data/

# Создаём директорию для отчётов
RUN mkdir -p /app/data/reports

EXPOSE 8000

CMD ["uvicorn", "liquidity.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
