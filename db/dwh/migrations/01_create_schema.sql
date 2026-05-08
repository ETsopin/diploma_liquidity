-- ============================================================
-- Схемы БД
-- ============================================================
CREATE SCHEMA IF NOT EXISTS staging;   -- сырые данные после ETL
CREATE SCHEMA IF NOT EXISTS dwh;       -- нормализованное хранилище
CREATE SCHEMA IF NOT EXISTS mart;      -- витрины данных (денормализованные)
CREATE SCHEMA IF NOT EXISTS audit;     -- журналы ETL и расчётов


-- ============================================================
-- AUDIT: Пользователи системы
-- ============================================================
CREATE TABLE IF NOT EXISTS audit.users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,   -- SHA-256 hash
    role        VARCHAR(50)  NOT NULL DEFAULT 'analyst'
                CHECK (role IN ('admin', 'analyst', 'viewer')),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit.users IS 'Пользователи системы. Роли: admin, analyst, viewer';


-- ============================================================
-- AUDIT: Источники данных
-- ============================================================
CREATE TABLE IF NOT EXISTS audit.datasource (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    source_type     VARCHAR(50)  NOT NULL
                    CHECK (source_type IN ('postgresql', 'excel', 'csv', 'hadoop')),
    connection_string TEXT,                 -- для SQL-источников
    file_path       TEXT,                  -- для файловых источников
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit.datasource IS 'Зарегистрированные источники данных';


-- ============================================================
-- AUDIT: Пакеты загрузки сырых данных (RAW batches)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit.rawdatabatch (
    id              SERIAL PRIMARY KEY,
    datasource_id   INT NOT NULL REFERENCES audit.datasource(id),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running', 'success', 'failed', 'partial')),
    rows_extracted  INT,
    rows_loaded     INT,
    error_message   TEXT,
    initiated_by    INT REFERENCES audit.users(id)
);

COMMENT ON TABLE audit.rawdatabatch IS 'Журнал запусков ETL-загрузок';


-- ============================================================
-- STAGING: Активы (сырые данные из источников)
-- ============================================================
CREATE TABLE IF NOT EXISTS staging.stagingasset (
    id              BIGSERIAL PRIMARY KEY,
    batch_id        INT NOT NULL REFERENCES audit.rawdatabatch(id),
    raw_contract_id VARCHAR(100),          -- ID контракта в источнике
    counterparty_code VARCHAR(100),        -- код контрагента из источника
    product_code    VARCHAR(100),          -- код продукта из источника
    amount          NUMERIC(18,2),
    currency        CHAR(3),
    maturity_date   DATE,                  -- дата погашения
    issue_date      DATE,                  -- дата выдачи/размещения
    asset_type      VARCHAR(50),           -- кредит, МБК, ценные бумаги и т.д.
    raw_data        JSONB,                 -- оригинальная строка в сыром виде
    is_processed    BOOLEAN NOT NULL DEFAULT FALSE,
    loaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_system   VARCHAR(100)
);

COMMENT ON TABLE staging.stagingasset IS 'Staging-слой: сырые данные об активах';
CREATE INDEX ON staging.stagingasset (batch_id);
CREATE INDEX ON staging.stagingasset (is_processed);
CREATE INDEX ON staging.stagingasset (maturity_date);


-- ============================================================
-- STAGING: Обязательства (сырые данные из источников)
-- ============================================================
CREATE TABLE IF NOT EXISTS staging.stagingliability (
    id              BIGSERIAL PRIMARY KEY,
    batch_id        INT NOT NULL REFERENCES audit.rawdatabatch(id),
    raw_contract_id VARCHAR(100),
    counterparty_code VARCHAR(100),
    product_code    VARCHAR(100),
    amount          NUMERIC(18,2),
    currency        CHAR(3),
    maturity_date   DATE,
    issue_date      DATE,
    liability_type  VARCHAR(50),           -- депозит, МБК привлеч., облигация и т.д.
    raw_data        JSONB,
    is_processed    BOOLEAN NOT NULL DEFAULT FALSE,
    loaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_system   VARCHAR(100)
);

COMMENT ON TABLE staging.stagingliability IS 'Staging-слой: сырые данные об обязательствах';
CREATE INDEX ON staging.stagingliability (batch_id);
CREATE INDEX ON staging.stagingliability (is_processed);
CREATE INDEX ON staging.stagingliability (maturity_date);


-- ============================================================
-- DWH: Справочник контрагентов
-- ============================================================
CREATE TABLE IF NOT EXISTS dwh.counterpartyref (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(100) NOT NULL UNIQUE,
    full_name       TEXT NOT NULL,
    short_name      VARCHAR(200),
    inn             VARCHAR(12),
    counterparty_type VARCHAR(50)          -- банк, корпоративный, физлицо, ЦБ
                    CHECK (counterparty_type IN ('bank', 'corporate', 'individual', 'cbr', 'other')),
    country         CHAR(2) DEFAULT 'RU',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dwh.counterpartyref IS 'Справочник контрагентов';


-- ============================================================
-- DWH: Справочник типов продуктов
-- ============================================================
CREATE TABLE IF NOT EXISTS dwh.producttyperef (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(200) NOT NULL,
    category        VARCHAR(50) NOT NULL   -- asset / liability
                    CHECK (category IN ('asset', 'liability')),
    subcategory     VARCHAR(100),          -- кредит, депозит, МБК, ценные бумаги...
    description     TEXT
);

COMMENT ON TABLE dwh.producttyperef IS 'Справочник типов финансовых продуктов';


-- ============================================================
-- DWH: Временные интервалы для ГЭП-анализа
-- ============================================================
CREATE TABLE IF NOT EXISTS dwh.timebucket (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    min_days        INT NOT NULL,          -- нижняя граница интервала (дни)
    max_days        INT,                   -- верхняя граница (NULL = без ограничений)
    sort_order      INT NOT NULL,
    description     TEXT
);

COMMENT ON TABLE dwh.timebucket IS 'Временные интервалы для расчёта разрывов ликвидности';

-- Стандартные временные корзины ЦБ РФ
INSERT INTO dwh.timebucket (code, name, min_days, max_days, sort_order, description) VALUES
    ('ON_DEMAND',  'До востребования',   0,    0,   1, 'Обязательства/активы до востребования'),
    ('D1',         '1 день',             1,    1,   2, 'Срок 1 день'),
    ('D2_7',       '2–7 дней',           2,    7,   3, 'Срок от 2 до 7 дней'),
    ('D8_30',      '8–30 дней',          8,   30,   4, 'Срок от 8 до 30 дней'),
    ('D31_90',     '31–90 дней',        31,   90,   5, 'Срок от 31 до 90 дней'),
    ('D91_180',    '91–180 дней',       91,  180,   6, 'Срок от 91 до 180 дней'),
    ('D181_365',   '181–365 дней',     181,  365,   7, 'Срок от 181 до 365 дней'),
    ('OVER_1Y',    'Свыше 1 года',     366, NULL,   8, 'Срок свыше 1 года')
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- DWH: Нормализованные активы
-- ============================================================
CREATE TABLE IF NOT EXISTS dwh.asset (
    id                  BIGSERIAL PRIMARY KEY,
    staging_id          BIGINT REFERENCES staging.stagingasset(id),
    batch_id            INT NOT NULL REFERENCES audit.rawdatabatch(id),
    counterparty_id     INT REFERENCES dwh.counterpartyref(id),
    product_type_id     INT REFERENCES dwh.producttyperef(id),
    contract_number     VARCHAR(100),
    amount              NUMERIC(18,2) NOT NULL,
    amount_rub          NUMERIC(18,2),           -- сумма в рублях (после пересчёта)
    currency            CHAR(3) NOT NULL,
    exchange_rate       NUMERIC(10,6) DEFAULT 1,
    issue_date          DATE,
    maturity_date       DATE,
    timebucket_id       INT REFERENCES dwh.timebucket(id),
    days_to_maturity    INT,                     -- вычисляется при загрузке
    report_date         DATE NOT NULL,           -- дата отчёта
    is_valid            BOOLEAN NOT NULL DEFAULT TRUE,
    validation_notes    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dwh.asset IS 'DWH: нормализованные данные об активах';
CREATE INDEX ON dwh.asset (report_date);
CREATE INDEX ON dwh.asset (timebucket_id);
CREATE INDEX ON dwh.asset (counterparty_id);


-- ============================================================
-- DWH: Нормализованные обязательства
-- ============================================================
CREATE TABLE IF NOT EXISTS dwh.liability (
    id                  BIGSERIAL PRIMARY KEY,
    staging_id          BIGINT REFERENCES staging.stagingliability(id),
    batch_id            INT NOT NULL REFERENCES audit.rawdatabatch(id),
    counterparty_id     INT REFERENCES dwh.counterpartyref(id),
    product_type_id     INT REFERENCES dwh.producttyperef(id),
    contract_number     VARCHAR(100),
    amount              NUMERIC(18,2) NOT NULL,
    amount_rub          NUMERIC(18,2),
    currency            CHAR(3) NOT NULL,
    exchange_rate       NUMERIC(10,6) DEFAULT 1,
    issue_date          DATE,
    maturity_date       DATE,
    timebucket_id       INT REFERENCES dwh.timebucket(id),
    days_to_maturity    INT,
    report_date         DATE NOT NULL,
    is_valid            BOOLEAN NOT NULL DEFAULT TRUE,
    validation_notes    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dwh.liability IS 'DWH: нормализованные данные об обязательствах';
CREATE INDEX ON dwh.liability (report_date);
CREATE INDEX ON dwh.liability (timebucket_id);
CREATE INDEX ON dwh.liability (counterparty_id);


-- ============================================================
-- DWH: Запуски расчётов (ГЭП-анализ)
-- ============================================================
CREATE TABLE IF NOT EXISTS dwh.gapcalculation (
    id              SERIAL PRIMARY KEY,
    report_date     DATE NOT NULL,
    calc_type       VARCHAR(50) NOT NULL DEFAULT 'gap'
                    CHECK (calc_type IN ('gap', 'concentration', 'full')),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'success', 'failed')),
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    error_message   TEXT,
    initiated_by    INT REFERENCES audit.users(id),
    params          JSONB,                 -- доп. параметры расчёта
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dwh.gapcalculation IS 'Журнал запусков расчётного ядра';


-- ============================================================
-- DWH: Результаты расчёта разрывов ликвидности
-- ============================================================
CREATE TABLE IF NOT EXISTS dwh.gapresult (
    id                  BIGSERIAL PRIMARY KEY,
    calculation_id      INT NOT NULL REFERENCES dwh.gapcalculation(id),
    report_date         DATE NOT NULL,
    timebucket_id       INT NOT NULL REFERENCES dwh.timebucket(id),
    total_assets        NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_liabilities   NUMERIC(18,2) NOT NULL DEFAULT 0,
    gap                 NUMERIC(18,2) GENERATED ALWAYS AS (total_assets - total_liabilities) STORED,
    cumulative_gap      NUMERIC(18,2),      -- накопленный разрыв (заполняется расч. ядром)
    gap_ratio           NUMERIC(8,4),       -- gap / total_liabilities, %
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dwh.gapresult IS 'Результаты расчёта разрывов ликвидности по временным корзинам';
CREATE INDEX ON dwh.gapresult (report_date);
CREATE UNIQUE INDEX ON dwh.gapresult (calculation_id, timebucket_id);


-- ============================================================
-- DWH: Результаты расчёта концентрации
-- ============================================================
CREATE TABLE IF NOT EXISTS dwh.concentrationresult (
    id                  BIGSERIAL PRIMARY KEY,
    calculation_id      INT NOT NULL REFERENCES dwh.gapcalculation(id),
    report_date         DATE NOT NULL,
    counterparty_id     INT NOT NULL REFERENCES dwh.counterpartyref(id),
    category            VARCHAR(10) NOT NULL CHECK (category IN ('asset', 'liability')),
    amount_rub          NUMERIC(18,2) NOT NULL,
    share_pct           NUMERIC(6,3),       -- доля в портфеле, %
    timebucket_id       INT REFERENCES dwh.timebucket(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE dwh.concentrationresult IS 'Результаты расчёта концентрации по контрагентам';
CREATE INDEX ON dwh.concentrationresult (report_date, category);


-- ============================================================
-- DWH: Задачи генерации отчётов
-- ============================================================
CREATE TABLE IF NOT EXISTS dwh.reporttask (
    id              SERIAL PRIMARY KEY,
    calculation_id  INT REFERENCES dwh.gapcalculation(id),
    report_type     VARCHAR(50) NOT NULL
                    CHECK (report_type IN ('gap', 'concentration', 'full')),
    report_format   VARCHAR(10) NOT NULL
                    CHECK (report_format IN ('xlsx', 'pdf', 'csv')),
    report_name     VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'success', 'failed')),
    file_path       TEXT,                  -- путь к сформированному файлу
    error_message   TEXT,
    report_date     DATE,
    initiated_by    INT REFERENCES audit.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ
);

COMMENT ON TABLE dwh.reporttask IS 'Задачи и статусы генерации отчётов';


-- ============================================================
-- MART: Витрина — сводная таблица разрывов (для API/фронта)
-- ============================================================
CREATE TABLE IF NOT EXISTS mart.liquidity_gap_view (
    id                  BIGSERIAL PRIMARY KEY,
    report_date         DATE NOT NULL,
    calculation_id      INT NOT NULL,
    bucket_code         VARCHAR(50) NOT NULL,
    bucket_name         VARCHAR(100) NOT NULL,
    sort_order          INT NOT NULL,
    total_assets_rub    NUMERIC(18,2),
    total_liabilities_rub NUMERIC(18,2),
    gap_rub             NUMERIC(18,2),
    cumulative_gap_rub  NUMERIC(18,2),
    gap_ratio_pct       NUMERIC(8,4),
    refreshed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE mart.liquidity_gap_view IS 'Витрина данных: разрывы ликвидности (денормализовано для фронта)';
CREATE INDEX ON mart.liquidity_gap_view (report_date);


-- ============================================================
-- Дефолтный пользователь-администратор
-- (пароль: admin123 -> SHA-256)
-- ============================================================
INSERT INTO audit.users (username, email, password_hash, role)
VALUES (
    'admin',
    'admin@liquidity.local',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    'admin'
) ON CONFLICT (username) DO NOTHING;
