-- ============================================================
-- Имитация банковской АБС (Автоматизированной Банковской Системы)
--
-- Схема имитирует типовые таблицы банковского ядра:
--   - контрагенты
--   - договоры (кредиты, депозиты, МБК)
--   - остатки на счетах
--   - курсы валют
-- ============================================================

-- ============================================================
-- Контрагенты
-- ============================================================
CREATE TABLE IF NOT EXISTS counterparties (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(50)  NOT NULL UNIQUE,
    full_name       TEXT         NOT NULL,
    short_name      VARCHAR(200),
    inn             VARCHAR(12),
    client_type     VARCHAR(30)  NOT NULL
                    CHECK (client_type IN ('bank', 'corporate', 'individual', 'cbr')),
    country_code    CHAR(2)      DEFAULT 'RU',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE counterparties IS 'Клиенты и контрагенты банка';


-- ============================================================
-- Договоры — активные операции (кредиты, МБК размещ., ценные бумаги)
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts_assets (
    id              SERIAL PRIMARY KEY,
    contract_number VARCHAR(50)  NOT NULL UNIQUE,
    counterparty_id INT          NOT NULL REFERENCES counterparties(id),
    product_type    VARCHAR(50)  NOT NULL,
    -- CREDIT_CORPORATE, CREDIT_RETAIL, CREDIT_MORTGAGE,
    -- IBC_PLACED, SECURITIES_GOVT, SECURITIES_CORP, CASH, CBR_DEPOSIT
    amount          NUMERIC(18,2) NOT NULL,
    currency        CHAR(3)       NOT NULL DEFAULT 'RUB',
    interest_rate   NUMERIC(6,3),           -- % годовых
    issue_date      DATE          NOT NULL,
    maturity_date   DATE,                   -- NULL = до востребования
    status          VARCHAR(20)   NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'closed', 'overdue', 'restructured')),
    account_number  VARCHAR(20),
    notes           TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE contracts_assets IS 'Договоры по активным операциям банка';
CREATE INDEX ON contracts_assets (maturity_date);
CREATE INDEX ON contracts_assets (status);


-- ============================================================
-- Договоры — пассивные операции (депозиты, МБК привлеч., облигации)
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts_liabilities (
    id              SERIAL PRIMARY KEY,
    contract_number VARCHAR(50)  NOT NULL UNIQUE,
    counterparty_id INT          NOT NULL REFERENCES counterparties(id),
    product_type    VARCHAR(50)  NOT NULL,
    -- DEPOSIT_RETAIL, DEPOSIT_CORPORATE, DEPOSIT_DEMAND,
    -- IBC_ATTRACTED, BOND_ISSUED, SUBORD_LOAN
    amount          NUMERIC(18,2) NOT NULL,
    currency        CHAR(3)       NOT NULL DEFAULT 'RUB',
    interest_rate   NUMERIC(6,3),
    issue_date      DATE          NOT NULL,
    maturity_date   DATE,                   -- NULL = до востребования
    status          VARCHAR(20)   NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'closed', 'early_withdrawal')),
    account_number  VARCHAR(20),
    notes           TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE contracts_liabilities IS 'Договоры по пассивным операциям банка';
CREATE INDEX ON contracts_liabilities (maturity_date);
CREATE INDEX ON contracts_liabilities (status);


-- ============================================================
-- Остатки на счетах (для счетов до востребования)
-- ============================================================
CREATE TABLE IF NOT EXISTS account_balances (
    id              SERIAL PRIMARY KEY,
    account_number  VARCHAR(20)   NOT NULL,
    counterparty_id INT           NOT NULL REFERENCES counterparties(id),
    account_type    VARCHAR(30)   NOT NULL,  -- current, correspondent, etc.
    balance         NUMERIC(18,2) NOT NULL DEFAULT 0,
    currency        CHAR(3)       NOT NULL DEFAULT 'RUB',
    balance_date    DATE          NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE account_balances IS 'Остатки на расчётных и корреспондентских счетах';
CREATE INDEX ON account_balances (balance_date);


-- ============================================================
-- Курсы валют
-- ============================================================
CREATE TABLE IF NOT EXISTS exchange_rates (
    id              SERIAL PRIMARY KEY,
    currency_code   CHAR(3)       NOT NULL,
    rate_date       DATE          NOT NULL,
    rate_to_rub     NUMERIC(10,6) NOT NULL,
    source          VARCHAR(50)   DEFAULT 'CBR',
    UNIQUE (currency_code, rate_date)
);

COMMENT ON TABLE exchange_rates IS 'Курсы валют к рублю (ЦБ РФ)';
